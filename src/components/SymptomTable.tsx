/**
 * Paginated and filterable symptom log table
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SymptomEntry, Location } from '@/types';
import {
  getFilteredSymptoms,
  getIssues,
  deleteSymptom,
  SymptomFilterOptions,
} from '@/localStorage';
import { Pagination } from './Pagination';
import { SymptomDetailsDialog } from './SymptomDetailsDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Eye, Trash2, Search, X } from 'lucide-react';

interface SymptomTableProps {
  refreshTrigger?: number;
}

export function SymptomTable({ refreshTrigger = 0 }: SymptomTableProps) {
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<SymptomFilterOptions>({
    page: 1,
    limit: 10,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Dialog states
  const [selectedSymptom, setSelectedSymptom] = useState<SymptomEntry | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [symptomToDelete, setSymptomToDelete] = useState<SymptomEntry | null>(null);

  const issues = getIssues();

  // Load symptoms when filters or refresh trigger change
  useEffect(() => {
    loadSymptoms();
  }, [filters, refreshTrigger]);

  const loadSymptoms = () => {
    const result = getFilteredSymptoms(filters);
    setSymptoms(result.symptoms);
    setTotal(result.total);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setFilters({ ...filters, page });
  };

  const handleFilterChange = (key: keyof SymptomFilterOptions, value: any) => {
    setCurrentPage(1);
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 10 });
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleDelete = () => {
    if (!symptomToDelete) return;

    try {
      deleteSymptom(symptomToDelete.id);
      setSymptomToDelete(null);
      loadSymptoms();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete symptom');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const totalPages = Math.ceil(total / (filters.limit || 10));

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Symptom Log</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-gray-600 border-gray-300 h-7 px-3"
        >
          Filter
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select
                value={filters.location || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('location', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {Object.values(Location).map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Issue</label>
              <Select
                value={
                  filters.issueId === null
                    ? 'none'
                    : filters.issueId || 'all'
                }
                onValueChange={(value) =>
                  handleFilterChange(
                    'issueId',
                    value === 'all' ? undefined : value === 'none' ? null : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All issues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All issues</SelectItem>
                  <SelectItem value="none">No issue</SelectItem>
                  {issues.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Severity</label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="0"
                value={filters.severityMin || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'severityMin',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Severity</label>
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="10"
                value={filters.severityMax || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'severityMax',
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      )}

      {/* Table - Minimal design with responsive layout */}
      <div className="bg-white overflow-x-auto">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block">
          {/* Column Headers */}
          <div className="grid grid-cols-6 gap-3 px-3 py-2 border-b border-gray-200">
            <div className="text-sm font-medium text-gray-500">Date</div>
            <div className="text-sm font-medium text-gray-500">Location</div>
            <div className="text-sm font-medium text-gray-500">Severity</div>
            <div className="text-sm font-medium text-gray-500 col-span-2">Description</div>
            <div className="text-sm font-medium text-gray-500 text-right">Actions</div>
          </div>

          {/* Data Rows */}
          <div className="divide-y divide-gray-100">
            {symptoms.length > 0 ? (
              symptoms.map((symptom) => {
                return (
                  <div key={symptom.id} className="grid grid-cols-6 gap-3 px-3 py-2 hover:bg-gray-50">
                    <div className="text-sm text-gray-900">
                      {formatDate(symptom.timestamp)}
                    </div>
                    <div className="text-sm text-gray-900 capitalize">
                      {symptom.metadata.location.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-900">
                      {symptom.metadata.severity}/10
                    </div>
                    <div className="text-sm text-gray-900 col-span-2 truncate">
                      {symptom.metadata.description || '-'}
                    </div>
                    <div className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSymptom(symptom);
                            setShowDetailsDialog(true);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Eye className="h-3 w-3 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSymptomToDelete(symptom)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="h-3 w-3 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-6 text-center text-gray-500 text-sm">
                No symptoms found
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View - Visible on mobile only */}
        <div className="md:hidden divide-y divide-gray-100">
          {symptoms.length > 0 ? (
            symptoms.map((symptom) => {
              return (
                <div key={symptom.id} className="p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <div className="text-xs text-gray-500">
                        {formatDate(symptom.timestamp)}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {symptom.metadata.description || '-'}
                      </div>
                      <div className="flex gap-3 text-xs text-gray-600">
                        <span className="capitalize">
                          {symptom.metadata.location.replace(/_/g, ' ')}
                        </span>
                        <span>Severity: {symptom.metadata.severity}/10</span>
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSymptom(symptom);
                          setShowDetailsDialog(true);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSymptomToDelete(symptom)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              No symptoms found
            </div>
          )}
        </div>
      </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 mt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={filters.limit || 10}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SymptomDetailsDialog
        symptom={selectedSymptom}
        open={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedSymptom(null);
        }}
      />

      <DeleteConfirmDialog
        open={!!symptomToDelete}
        title="Delete Symptom"
        description="Are you sure you want to delete this symptom entry? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setSymptomToDelete(null)}
      />
    </div>
  );
}
