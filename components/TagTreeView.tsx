
import React, { useState } from 'react';
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
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, selectedTags, onToggleTag, level }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  const selection = selectedTags[node.id];
  const isSelected = !!selection;
  const isImplied = isSelected && !!selection.impliedBy;

  return (
    <div>
      <div className="flex items-center space-x-2 py-1">
        <div style={{ paddingLeft: `${level * 1.5}rem` }} className="flex items-center flex-grow">
          {hasChildren ? (
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full hover:bg-bunker-100 dark:hover:bg-bunker-800" aria-label={isOpen ? 'Collapse' : 'Expand'}>
              <Icon name="chevronRight" className={`w-4 h-4 text-bunker-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          ) : (
            <div className="w-6" /> 
          )}
          <div className="ml-2">
            <TagChip
              tag={node}
              isSelected={isSelected}
              onToggle={onToggleTag}
              isImplied={isImplied}
              implyingTagLabel={selection?.implyingTagLabel}
            />
          </div>
        </div>
      </div>
      {isOpen && hasChildren && (
        <TagTreeView nodes={node.children} selectedTags={selectedTags} onToggleTag={onToggleTag} level={level + 1} />
      )}
    </div>
  );
};

interface TagTreeViewProps {
  nodes: TreeNodeData[];
  selectedTags: Record<string, SelectedTag>;
  onToggleTag: (tag: Tag) => void;
  level?: number;
}

export const TagTreeView: React.FC<TagTreeViewProps> = ({ nodes, selectedTags, onToggleTag, level = 0 }) => {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <TreeNode key={node.id} node={node} selectedTags={selectedTags} onToggleTag={onToggleTag} level={level} />
      ))}
    </div>
  );
};
