'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { glApi } from '@/services/api';
import { GLCode } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/ui/Modal';

export default function GLCodesPage() {
  const [glCodes, setGlCodes] = useState<GLCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Operating Expenses',
    description: '',
    active: true
  });

  const fetchGLCodes = async () => {
    try {
      setLoading(true);
      const data = await glApi.list();
      setGlCodes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGLCodes();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setFormData({
      code: '',
      name: '',
      category: 'Operating Expenses',
      description: '',
      active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (gl: GLCode) => {
    setEditId(gl.id);
    setFormData({
      code: gl.code,
      name: gl.name,
      category: gl.category,
      description: gl.description || '',
      active: gl.active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await glApi.update(editId, formData);
      } else {
        await glApi.create(formData);
      }
      setIsModalOpen(false);
      fetchGLCodes();
    } catch (err: any) {
      alert(err.message || 'Failed to save GL code');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to deactivate or remove GL Code ${code}?`)) return;
    try {
      await glApi.delete(id);
      fetchGLCodes();
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    }
  };

  const filteredGL = glCodes.filter(
    (g) =>
      g.code.toLowerCase().includes(search.toLowerCase()) ||
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-terminal pb-10 text-yellow-400">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
        <div>
          <h1 className="text-xl font-extrabold tracking-widest text-orange-500 uppercase">
            CHART OF ACCOUNTS (GL CODES) [F8]
          </h1>
          <p className="text-xs text-yellow-400/70 mt-1 font-sans">
            Configure Chart of Accounts used for automated ledger mapping and financial expense grouping
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-2 text-xs font-bold text-black uppercase shadow-lg transition-colors font-mono"
        >
          <Plus className="w-4 h-4 text-black" />
          <span>ADD GL CODE</span>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 bg-[#121212] p-3 rounded-md border border-[#262626] font-mono text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-orange-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH CODE OR CATEGORY..."
            className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] pl-9 pr-3 py-1.5 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 font-mono uppercase"
          />
        </div>
        <span className="text-xs text-yellow-400 font-bold uppercase">
          {filteredGL.length} GL ACCOUNTS ACTIVE
        </span>
      </div>

      {loading ? (
        <LoadingSpinner label="LOADING GENERAL LEDGER ACCOUNTS..." />
      ) : filteredGL.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No GL codes found"
          description="Create your first general ledger account code to enable automated categorization."
          actionLabel="Add GL Code"
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bloomberg-panel rounded-md overflow-hidden border border-[#262626] bg-[#121212]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="border-b border-[#262626] bg-[#0a0a0a] text-orange-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-5 py-3">GL CODE</th>
                  <th className="px-4 py-3">ACCOUNT NAME</th>
                  <th className="px-4 py-3">CATEGORY</th>
                  <th className="px-4 py-3">DESCRIPTION</th>
                  <th className="px-4 py-3 text-center">ACTIVE STATUS</th>
                  <th className="px-5 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626] text-yellow-400">
                {filteredGL.map((gl) => (
                  <tr key={gl.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-5 py-3.5 font-bold font-mono text-orange-400">{gl.code}</td>
                    <td className="px-4 py-3.5 font-bold text-yellow-400 uppercase">{gl.name}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-[#1c1c1c] border border-[#333333] px-2 py-0.5 text-[10px] text-orange-400 font-bold uppercase">
                        {gl.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-yellow-400/80 max-w-xs truncate font-sans">{gl.description || '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${
                          gl.active
                            ? 'bg-yellow-950 text-yellow-400 border-yellow-700'
                            : 'bg-[#1a1a1a] text-yellow-400/40 border-[#333333]'
                        }`}
                      >
                        {gl.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(gl)}
                          className="rounded p-1 text-orange-400 hover:bg-[#1a1a1a]"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(gl.id, gl.code)}
                          className="rounded p-1 text-orange-400 hover:bg-[#1a1a1a]"
                          title="Deactivate / Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit GL Code' : 'Add New GL Code'}
        subtitle="Chart of accounts classification"
      >
        <form onSubmit={handleSubmit} className="space-y-4 font-terminal text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">GL Code #</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="6201"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Account Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono"
                placeholder="Cloud/Software Expenses"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Financial Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 focus:outline-none focus:border-orange-500 font-mono uppercase"
            >
              <option value="Operating Expenses">OPERATING EXPENSES</option>
              <option value="Capital Expenditure">CAPITAL EXPENDITURE</option>
              <option value="Cost of Goods Sold">COST OF GOODS SOLD</option>
              <option value="Current Assets">CURRENT ASSETS</option>
              <option value="Current Liabilities">CURRENT LIABILITIES</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-orange-400 mb-1 uppercase">Description / Mapping Scope</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., AWS, Azure, Google Cloud, SaaS tool licenses"
              className="w-full rounded-md border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-xs text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-orange-500 h-20 font-sans"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 font-mono">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-md border border-[#262626] px-3.5 py-1.5 text-xs text-yellow-400 hover:bg-[#1a1a1a] uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-orange-500 hover:bg-orange-400 px-4 py-1.5 text-xs font-bold text-black uppercase"
            >
              Save GL Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
