'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  RefreshCw,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';

interface BulkOperationsProps {
  selectedItems: number[];
  itemType: 'matches' | 'teams' | 'players';
  onComplete: () => void;
}

export default function BulkOperations({ selectedItems, itemType, onComplete }: BulkOperationsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [operation, setOperation] = useState<string>('');

  const handleBulkOperation = async (op: string) => {
    if (selectedItems.length === 0) {
      alert('Please select items to perform bulk operations');
      return;
    }

    if (!confirm(`Are you sure you want to ${op} ${selectedItems.length} ${itemType}?`)) {
      return;
    }

    setIsLoading(true);
    setOperation(op);

    try {
      switch (op) {
        case 'start-matches':
          await supabase
            .from('matches')
            .update({ 
              status: 'in-progress',
              updated_at: new Date().toISOString()
            })
            .in('id', selectedItems);
          break;

        case 'complete-matches':
          await supabase
            .from('matches')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .in('id', selectedItems);
          break;

        case 'reset-matches':
          await supabase
            .from('matches')
            .update({ 
              status: 'scheduled',
              updated_at: new Date().toISOString()
            })
            .in('id', selectedItems);
          break;

        case 'delete-items':
          await supabase
            .from(itemType)
            .delete()
            .in('id', selectedItems);
          break;

        default:
          throw new Error('Unknown operation');
      }

      alert(`Successfully ${op.replace('-', ' ')} ${selectedItems.length} ${itemType}`);
      onComplete();
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert(`Failed to ${op.replace('-', ' ')} ${itemType}. Please try again.`);
    } finally {
      setIsLoading(false);
      setOperation('');
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(itemType)
        .select('*')
        .in('id', selectedItems.length > 0 ? selectedItems : []);

      if (error) throw error;

      const dataStr = JSON.stringify(data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `${itemType}-export-${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      alert(`Exported ${data?.length || 0} ${itemType} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export ${itemType}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
          <span className="text-blue-900 font-medium">
            {selectedItems.length} {itemType} selected
          </span>
        </div>

        <div className="flex space-x-2">
          {itemType === 'matches' && (
            <>
              <button
                onClick={() => handleBulkOperation('start-matches')}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-1" />
                {isLoading && operation === 'start-matches' ? 'Starting...' : 'Start All'}
              </button>
              <button
                onClick={() => handleBulkOperation('complete-matches')}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {isLoading && operation === 'complete-matches' ? 'Completing...' : 'Complete All'}
              </button>
              <button
                onClick={() => handleBulkOperation('reset-matches')}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                {isLoading && operation === 'reset-matches' ? 'Resetting...' : 'Reset All'}
              </button>
            </>
          )}

          <button
            onClick={exportData}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>

          <button
            onClick={() => handleBulkOperation('delete-items')}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading && operation === 'delete-items' ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
