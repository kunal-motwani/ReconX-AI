import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { DocumentService } from '../services/document.service';
import { sendSuccess, sendError } from '../utils/response';

const documentService = new DocumentService();

export class DocumentController {
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return sendError(res, 'No file uploaded.', 400);
      }

      const result = await documentService.uploadDocument({
        companyId: req.user!.companyId,
        userId: req.user!.id,
        file: req.file,
        documentType: req.body.documentType || 'INVOICE',
        description: req.body.description
      });

      return sendSuccess(res, result, 'Document uploaded and processed successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await documentService.getDocuments(req.user!.companyId, {
        type: req.query.type as string,
        status: req.query.status as string,
        search: req.query.search as string
      });
      return sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await documentService.getDocumentById(req.user!.companyId, req.params.id);
      return sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const doc = await documentService.getDocumentById(req.user!.companyId, req.params.id);
      if (!fs.existsSync(doc.filePath)) {
        return sendError(res, 'File not found on storage server.', 404);
      }
      return res.download(doc.filePath, doc.originalName);
    } catch (error) {
      next(error);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await documentService.deleteDocument(req.user!.companyId, req.params.id, req.user!.id);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}
