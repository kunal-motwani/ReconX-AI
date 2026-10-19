import fs from 'fs';
import path from 'path';
import { prisma } from '../repositories/prisma';
import { createAuditLog } from '../utils/audit';
import { IDocumentExtractionProvider } from '../providers/interfaces/document-extraction.interface';
import { IGLMappingProvider } from '../providers/interfaces/gl-mapping.interface';
import { PythonAIProvider } from '../providers/python-ai.provider';

export class DocumentService {
  private extractionProvider: IDocumentExtractionProvider;
  private glMappingProvider: IGLMappingProvider;

  constructor(
    extractionProvider?: IDocumentExtractionProvider,
    glMappingProvider?: IGLMappingProvider
  ) {
    const pythonAI = new PythonAIProvider();
    this.extractionProvider = extractionProvider || pythonAI;
    this.glMappingProvider = glMappingProvider || pythonAI;
  }

  async uploadDocument(params: {
    companyId: string;
    userId: string;
    file: Express.Multer.File;
    documentType: any;
    description?: string;
  }) {
    const document = await prisma.document.create({
      data: {
        companyId: params.companyId,
        uploadedById: params.userId,
        fileName: params.file.filename,
        originalName: params.file.originalname,
        filePath: params.file.path,
        fileType: params.file.mimetype,
        documentType: params.documentType || 'INVOICE',
        fileSize: params.file.size,
        processingStatus: 'UPLOADED'
      }
    });

    await createAuditLog({
      companyId: params.companyId,
      userId: params.userId,
      action: 'DOCUMENT_UPLOADED',
      entity: 'Document',
      entityId: document.id,
      newValue: {
        fileName: document.fileName,
        documentType: document.documentType,
        fileSize: document.fileSize
      }
    });

    // Immediately trigger extraction pipeline
    return this.processDocument(params.companyId, document.id, params.userId);
  }

  async processDocument(companyId: string, documentId: string, userId?: string) {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, companyId }
    });

    if (!doc) throw new Error('Document not found.');

    await prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'PROCESSING' }
    });

    try {
      // 1. Extract structured data via Provider
      const extractedData = await this.extractionProvider.extractDocumentData(
        doc.filePath,
        doc.originalName,
        doc.documentType
      );

      // 2. Fetch company GL codes for mapping
      const glCodes = await prisma.gLCode.findMany({
        where: { companyId, active: true }
      });

      // 3. Map GL Code via Provider
      const glSuggestion = await this.glMappingProvider.suggestGLCode(
        companyId,
        extractedData.vendorName,
        extractedData.lineItems[0]?.description || 'General invoice line item',
        extractedData.totalAmount,
        glCodes
      );

      const matchedGL = glCodes.find(g => g.code === glSuggestion.glCode);

      // 4. Update document with extracted structured JSON
      const updatedDoc = await prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'PROCESSED',
          extractedData: JSON.stringify(extractedData)
        }
      });

      // 5. Create normalized transaction
      const sourceMap: Record<string, any> = {
        INVOICE: 'INVOICE',
        BANK_STATEMENT: 'BANK',
        RECEIPT: 'RECEIPT',
        PURCHASE_ORDER: 'PURCHASE_ORDER',
        EXPENSE_REPORT: 'EXPENSE'
      };

      const tx = await prisma.transaction.create({
        data: {
          companyId,
          documentId: doc.id,
          transactionType: doc.documentType === 'BANK_STATEMENT' ? 'CREDIT' : 'DEBIT',
          vendorName: extractedData.vendorName,
          amount: extractedData.totalAmount,
          currency: extractedData.currency || 'INR',
          transactionDate: new Date(extractedData.date),
          referenceNumber: extractedData.invoiceNumber || extractedData.referenceNumber,
          description: `Extracted from ${doc.originalName} (${extractedData.lineItems[0]?.description || 'Invoice'})`,
          source: sourceMap[doc.documentType] || 'INVOICE',
          status: 'UNMATCHED',
          glCodeId: matchedGL ? matchedGL.id : null,
          glConfidence: glSuggestion.confidence,
          glStatus: glSuggestion.status
        }
      });

      await createAuditLog({
        companyId,
        userId,
        action: 'DOCUMENT_PROCESSED',
        entity: 'Document',
        entityId: doc.id,
        newValue: {
          transactionId: tx.id,
          vendorName: tx.vendorName,
          amount: tx.amount,
          glCode: glSuggestion.glCode
        }
      });

      return {
        document: updatedDoc,
        transaction: tx,
        glMapping: glSuggestion
      };
    } catch (error: any) {
      await prisma.document.update({
        where: { id: documentId },
        data: { processingStatus: 'FAILED' }
      });
      throw error;
    }
  }

  async getDocuments(companyId: string, filters: { type?: string; status?: string; search?: string }) {
    const where: any = { companyId };
    if (filters.type && filters.type !== 'undefined') where.documentType = filters.type;
    if (filters.status && filters.status !== 'undefined') where.processingStatus = filters.status;
    if (filters.search && filters.search !== 'undefined') {
      where.OR = [
        { originalName: { contains: filters.search } },
        { fileName: { contains: filters.search } }
      ];
    }

    return prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        transactions: {
          include: {
            glCode: true,
            sourceRecons: true
          }
        }
      }
    });
  }

  async getDocumentById(companyId: string, id: string) {
    const doc = await prisma.document.findFirst({
      where: { id, companyId },
      include: {
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        transactions: {
          include: {
            glCode: true,
            sourceRecons: {
              include: {
                targetTransaction: true
              }
            },
            anomalies: true
          }
        }
      }
    });

    if (!doc) throw new Error('Document not found.');
    return doc;
  }

  async deleteDocument(companyId: string, id: string, userId: string) {
    const doc = await prisma.document.findFirst({ where: { id, companyId } });
    if (!doc) throw new Error('Document not found.');

    if (fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        console.warn('Could not remove file on disk:', err);
      }
    }

    await prisma.document.delete({ where: { id } });

    await createAuditLog({
      companyId,
      userId,
      action: 'DOCUMENT_DELETED',
      entity: 'Document',
      entityId: id,
      previousValue: { fileName: doc.originalName }
    });

    return { message: 'Document deleted successfully.' };
  }
}
