
import React, { useState, useEffect } from 'react';
import type { Tag, SelectedTag } from '../types';
import { TagChip } from './TagChip';
import { Icon } from './icons';

export interface TreeNodeData extends Tag {
  children: TreeNodeData[];
}

interface TreeNodeProps {
  node: TreeNodeData;
  selectedTags: Record<string, SelectedTag>;
  onToggleTag: (tag: Tag) => void;
  level: number;
  expandAllSignal: number;
  collapseAllSignal: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, selectedTags, onToggleTag, level, expandAllSignal, collapseAllSignal }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  const isSelected = !!selectedTags[node.id];

  useEffect(() => {
    if (hasChildren) setIsOpen(true);
  }, [expandAllSignal, hasChildren]);

  useEffect(() => {
    if (hasChildren) setIsOpen(false);
  }, [collapseAllSignal, hasChildren]);

  return (
    <div>
      <div className="grid grid-cols-[auto,1fr] md:grid-cols-[auto,auto,1fr] items-center gap-x-4 py-1 pr-4">
        {/* Column 1: Indentation and Chevron */}
        <div style={{ paddingLeft: `${level * 1.5}rem` }} className="flex items-center">
          {hasChildren ? (
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800" aria-label={isOpen ? 'Collapse' : 'Expand'}>
              <Icon name="chevronRight" className={`w-4 h-4 text-bunker-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <div className="w-6" />
          )}
        </div>

        {/* Column 2: Tag Chip */}
        <div>
          <TagChip
            tag={node}
            isSelected={isSelected}
            onToggle={onToggleTag}
          />
        </div>

        {/* Column 3: Description */}
        <div className="min-w-0 hidden md:block">
          <p className="text-sm text-bunker-500 dark:text-bunker-400 truncate" title={node.description}>
            {node.description}
          </p>
        </div>
      </div>
      {isOpen && hasChildren && (
        <TagTreeView 
            nodes={node.children} 
            selectedTags={selectedTags} 
            onToggleTag={onToggleTag} 
            level={level + 1}
            expandAllSignal={expandAllSignal}
            collapseAllSignal={collapseAllSignal}
        />
      )}
    </div>
  );
};

interface TagTreeViewProps {
  nodes: TreeNodeData[];
  selectedTags: Record<string, SelectedTag>;
  onToggleTag: (tag: Tag) => void;
  level?: number;
  expandAllSignal: number;
  collapseAllSignal: number;
}

export const TagTreeView: React.FC<TagTreeViewProps> = ({ nodes, selectedTags, onToggleTag, level = 0, expandAllSignal, collapseAllSignal }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <TreeNode 
            key={node.id} 
            node={node} 
            selectedTags={selectedTags} 
            onToggleTag={onToggleTag} 
            level={level}
            expandAllSignal={expandAllSignal}
            collapseAllSignal={collapseAllSignal}
        />
      ))}
    </div>
  );
};