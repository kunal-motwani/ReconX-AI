'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Search,
  Filter,
  CheckCircle,
  Plus,
  ArrowUpDown,
  FileText,
  Eye,
  CheckCheck,
  ChevronDown
} from 'lucide-react';
import { transactionApi, glApi } from '@/services/api';
import { Transaction, GLCode } from '@/types';
import { formatDate, formatCurrency } from '@/utils/format';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/common/Pagination';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [glCodes, setGlCodes] = useState<GLCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [glFilter, setGlFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(15);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);

  // Add Transaction Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    vendorName: '',
    amount: '',
    referenceNumber: '',
    transactionDate: new Date().toISOString().split('T')[0],
    source: 'INVOICE',
    glCodeId: '',
    description: '',
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res: any = await transactionApi.list({
        page,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        source: sourceFilter || undefined,
        glCodeId: glFilter || undefined,
      });

      if (Array.isArray(res)) {
        setTransactions(res);
        setTotalCount(res.length);
        setTotalPages(1);
      } else if (res?.transactions) {
        setTransactions(res.transactions);
        setTotalCount(res.pagination?.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    glApi.list().then(setGlCodes).catch(console.error);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, sourceFilter, glFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setBulkApproving(true);
    try {
      await transactionApi.bulkApprove(selectedIds);
      setSelectedIds([]);
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Bulk approve failed');
    } finally {
      setBulkApproving(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await transactionApi.create({
        ...newTx,
        amount: Number(newTx.amount),
        currency: 'INR',
        glCodeId: newTx.glCodeId || undefined,
      });
      setIsAddOpen(false);
      setNewTx({
        vendorName: '',
        amount: '',
        referenceNumber: '',
        transactionDate: new Date().toISOString().split('T')[0],
        source: 'INVOICE',
        glCodeId: '',
        description: '',
      });
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Transaction creation failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
            GENERAL LEDGER FEED [F3]
          </h1>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Normalized accounting transactions, multi-source ingestion, and automated GL categorization
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={bulkApproving}
              className="inline-flex items-center gap-1.5 rounded-md bg-orange-950 border border-orange-800 hover:bg-orange-900 px-3.5 py-2 text-xs font-bold text-orange-400 uppercase transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-orange-400" />
              <span>APPROVE SELECTED ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase shadow-lg transition-colors font-mono"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>ADD TRANSACTION</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-[#121212] p-3 rounded-md border border-[#262626]">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-orange-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH VENDOR, REF, DESC..."
            className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] pl-9 pr-3 py-1.5 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 font-mono"
          />
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full lg:w-auto font-mono text-xs">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="">ALL STATUSES</option>
            <option value="MATCHED">MATCHED</option>
            <option value="UNMATCHED">UNMATCHED</option>
            <option value="PARTIALLY_MATCHED">PARTIALLY MATCHED</option>
            <option value="REVIEW_REQUIRED">REVIEW REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="">ALL SOURCES</option>
            <option value="INVOICE">INVOICE</option>
            <option value="BANK">BANK</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="PURCHASE_ORDER">PURCHASE ORDER</option>
            <option value="EXPENSE">EXPENSE</option>
          </select>

          <select
            value={glFilter}
            onChange={(e) => {
              setGlFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-1.5 text-yellow-400 focus:outline-none focus:border-orange-500 uppercase"
          >
            <option value="">ALL GL CODES</option>
            {glCodes.map((gl) => (
              <option key={gl.id} value={gl.id}>
                {gl.code} - {gl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <LoadingSpinner label="QUERYING LEDGER TRANSACTIONS..." />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Try changing your filters or upload financial documents to populate ledger transactions."
          actionLabel="Create Transaction"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="bloomberg-panel rounded-md overflow-hidden border border-[#262626] bg-[#121212]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#262626] bg-[#0a0a0a] text-orange-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === transactions.length && transactions.length > 0}
                      className="rounded border-[#262626] bg-[#0a0a0a] text-orange-500 focus:ring-orange-500"
                    />
                  </th>
                  <th className="px-4 py-3">DATE</th>
                  <th className="px-4 py-3">VENDOR</th>
                  <th className="px-4 py-3">REFERENCE</th>
                  <th className="px-4 py-3 text-right">AMOUNT</th>
                  <th className="px-4 py-3">SOURCE</th>
                  <th className="px-4 py-3">GL CODE</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-4 py-3 text-center">CONFIDENCE</th>
                  <th className="px-4 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-yellow-400">
                {transactions.map((tx) => {
                  const isSelected = selectedIds.includes(tx.id);
                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-[#1a1a1a] transition-colors ${
                        isSelected ? 'bg-[#1e1e1e]' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(tx.id)}
                          className="rounded border-[#262626] bg-[#0a0a0a] text-orange-500 focus:ring-orange-500"
                        />
                      </td>
                      <td className="px-4 py-3.5 text-yellow-400/80 whitespace-nowrap">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-yellow-400">
                        <Link href={`/transactions/${tx.id}`} className="hover:text-orange-400">
                          {tx.vendorName}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-orange-400">
                        {tx.referenceNumber}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-yellow-400 whitespace-nowrap">
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td className="px-4 py-3.5 uppercase">
                        <span className="rounded bg-[#1a1a1a] border border-[#333333] px-2 py-0.5 text-[10px] font-bold text-orange-400">
                          {tx.source}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {tx.glCode ? (
                          <span
                            className="rounded bg-[#1c1c1c] border border-orange-500/40 px-2 py-0.5 text-[11px] text-yellow-400 font-bold"
                            title={tx.glCode.name}
                          >
                            {tx.glCode.code} · {tx.glCode.name.split(' ')[0]}
                          </span>
                        ) : (
                          <span className="text-[11px] text-yellow-400/40">Unmapped</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 uppercase">
                        <StatusBadge status={tx.status} />
                      </td>
                      <td className="px-4 py-3.5 text-center font-mono">
                        {tx.glConfidence ? (
                          <span className="text-[11px] font-bold text-orange-400">
                            {Math.round(tx.glConfidence * 100)}%
                          </span>
                        ) : (
                          <span className="text-yellow-400/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/transactions/${tx.id}`}
                          className="rounded p-1 text-orange-400 hover:bg-[#1c1c1c] inline-block"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Normalized Transaction"
        subtitle="Manually add a journal entry to the reconciliation ledger"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-terminal text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Vendor / Beneficiary</label>
              <input
                type="text"
                required
                value={newTx.vendorName}
                onChange={(e) => setNewTx({ ...newTx, vendorName: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="Amazon Web Services"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={newTx.amount}
                onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="45000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Reference #</label>
              <input
                type="text"
                required
                value={newTx.referenceNumber}
                onChange={(e) => setNewTx({ ...newTx, referenceNumber: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="INV-2026-991"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Transaction Date</label>
              <input
                type="date"
                required
                value={newTx.transactionDate}
                onChange={(e) => setNewTx({ ...newTx, transactionDate: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Ledger Source</label>
              <select
                value={newTx.source}
                onChange={(e) => setNewTx({ ...newTx, source: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono uppercase"
              >
                <option value="INVOICE">INVOICE</option>
                <option value="BANK">BANK</option>
                <option value="RECEIPT">RECEIPT</option>
                <option value="PURCHASE_ORDER">PURCHASE ORDER</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">GL Code</label>
              <select
                value={newTx.glCodeId}
                onChange={(e) => setNewTx({ ...newTx, glCodeId: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono uppercase"
              >
                <option value="">AUTO / SUGGESTED</option>
                {glCodes.map((gl) => (
                  <option key={gl.id} value={gl.id}>
                    {gl.code} - {gl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Description</label>
            <input
              type="text"
              value={newTx.description}
              onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-sans"
              placeholder="Enterprise service description"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 font-mono">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="rounded-md border border-[#262626] px-3.5 py-1.5 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-1.5 text-xs font-bold text-black uppercase"
            >
              Save Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
