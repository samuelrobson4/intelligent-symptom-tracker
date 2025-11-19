/**
 * Paginated and filterable recurring issue record table
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
import { EnrichedIssue, getEnrichedIssues, getIssueStats } from '@/localStorage';
import { Pagination } from './Pagination';
import { IssueDetailsDialog } from './IssueDetailsDialog';
import { Eye, Search, X } from 'lucide-react';

interface IssueTableProps {
  refreshTrigger?: number;
}

export function IssueTable({ refreshTrigger = 0 }: IssueTableProps) {
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<EnrichedIssue[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 10;

  // Dialog state
  const [selectedIssue, setSelectedIssue] = useState<EnrichedIssue | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Load issues when refresh trigger changes
  useEffect(() => {
    loadIssues();
  }, [refreshTrigger]);

  // Apply filters when issues or filters change
  useEffect(() => {
    applyFilters();
  }, [issues, searchQuery, statusFilter]);

  const loadIssues = () => {
    const allIssues = getEnrichedIssues();
    setIssues(allIssues);
  };

  const applyFilters = () => {
    let filtered = [...issues];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((issue) =>
        issue.name.toLowerCase().includes(query)
      );
    }

    // Sort by createdAt descending (newest first)
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setFilteredIssues(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setShowFilters(false);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination
  const totalPages = Math.ceil(filteredIssues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedIssues = filteredIssues.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Recurring Issue Record</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search issue name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'active' | 'resolved') =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Table - Minimal design */}
      <div className="bg-white">
        {/* Column Headers */}
        <div className="grid grid-cols-6 gap-3 px-3 py-2 border-b border-gray-200">
          <div className="text-sm font-medium text-gray-500">Issue Name</div>
          <div className="text-sm font-medium text-gray-500">Status</div>
          <div className="text-sm font-medium text-gray-500">Start Date</div>
          <div className="text-sm font-medium text-gray-500">Total Entries</div>
          <div className="text-sm font-medium text-gray-500">Last Entry</div>
          <div className="text-sm font-medium text-gray-500 text-right">Actions</div>
        </div>

        {/* Data Rows */}
        <div className="divide-y divide-gray-100">
          {paginatedIssues.length > 0 ? (
            paginatedIssues.map((issue) => {
              const stats = getIssueStats(issue.id);
              return (
                <div key={issue.id} className="grid grid-cols-6 gap-3 px-3 py-2 hover:bg-gray-50">
                  <div className="text-sm text-gray-900">{issue.name}</div>
                  <div className="text-sm text-gray-900 capitalize">{issue.status}</div>
                  <div className="text-sm text-gray-900">{formatDate(issue.startDate)}</div>
                  <div className="text-sm text-gray-900">
                    {stats.totalEntries}
                    {stats.totalEntries > 0 && stats.avgSeverity > 0 && (
                      <span className="text-gray-500 ml-1">
                        (avg {stats.avgSeverity})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-900">
                    {issue.lastEntry ? `${issue.lastEntry.daysAgo}d ago` : '-'}
                  </div>
                  <div className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowDetailsDialog(true);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Eye className="h-3 w-3 text-gray-500" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-6 text-center text-gray-500 text-sm">
              No issues found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 mt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredIssues.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Dialog */}
      <IssueDetailsDialog
        issue={selectedIssue}
        open={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedIssue(null);
        }}
        onUpdate={() => {
          loadIssues();
          setShowDetailsDialog(false);
          setSelectedIssue(null);
        }}
      />
    </div>
  );
}
