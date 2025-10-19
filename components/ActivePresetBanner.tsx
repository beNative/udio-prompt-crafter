import React from 'react';
import { Icon } from './icons';
import { Tooltip } from './Tooltip';

interface ActivePresetBannerProps {
  name: string;
  description: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  promptPreview: string;
  isDirty: boolean;
  canUpdate: boolean;
  canSaveAsNew: boolean;
  updateDisabledReason?: string;
  saveAsNewDisabledReason?: string;
  onUpdate: () => void;
  onSaveAsNew: () => void;
  onRevert: () => void;
  onOpenEditing: () => void;
  onCloseEditing: () => void;
  onCancelEditing: () => void;
  isEditing: boolean;
  nameErrorMessage?: string;
  saveAsNewConflictMessage?: string;
  lastUpdated?: string | null;
}

export const ActivePresetBanner: React.FC<ActivePresetBannerProps> = ({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  promptPreview,
  isDirty,
  canUpdate,
  canSaveAsNew,
  updateDisabledReason,
  saveAsNewDisabledReason,
  onUpdate,
  onSaveAsNew,
  onRevert,
  onOpenEditing,
  onCloseEditing,
  onCancelEditing,
  isEditing,
  nameErrorMessage,
  saveAsNewConflictMessage,
  lastUpdated,
}) => {
  const previewText = promptPreview.trim()
    ? promptPreview
    : 'Add or adjust tags to generate a fresh preview instantly.';

  const formattedLastUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : null;

  return (
    <section className="shrink-0 border-b border-blue-200/70 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-100">
            <Icon name="bookmark" className="w-5 h-5" />
            <h2 className="text-sm font-semibold tracking-wide uppercase">Active Preset</h2>
            {isDirty ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-700 text-[10px] font-semibold uppercase tracking-wide">
                Unsaved Changes
              </span>
            ) : (
              <span className="text-xs text-blue-600/70 dark:text-blue-200/70">Up to date</span>
            )}
          </div>
          {formattedLastUpdated && (
            <p className="mt-1 text-xs text-blue-700/70 dark:text-blue-300/70">Last updated {formattedLastUpdated}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Tooltip text="Revert to the saved preset">
              <div>
                <button
                  onClick={onRevert}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-blue-300/60 dark:border-blue-700/60 text-blue-700 dark:text-blue-200 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors text-xs font-semibold"
                >
                  <Icon name="history" className="w-4 h-4" />
                  Revert
                </button>
              </div>
            </Tooltip>
          )}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Tooltip text="Collapse editor">
                <div>
                  <button
                    onClick={onCloseEditing}
                    className="px-3 py-1.5 rounded-md bg-blue-200/70 text-blue-800 text-xs font-semibold hover:bg-blue-200 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </Tooltip>
              <Tooltip text="Cancel and restore saved details">
                <div>
                  <button
                    onClick={onCancelEditing}
                    className="px-3 py-1.5 rounded-md border border-transparent text-blue-700 dark:text-blue-200 text-xs font-semibold hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </Tooltip>
            </div>
          ) : (
            <Tooltip text="Edit preset name and description">
              <div>
                <button
                  onClick={onOpenEditing}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Icon name="pencil" className="w-4 h-4" />
                  Edit Details
                </button>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide mb-1">
              Preset Name
            </label>
            <input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="form-input w-full text-sm"
              placeholder="Preset name"
            />
            {nameErrorMessage && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{nameErrorMessage}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-blue-800 dark:text-blue-200 uppercase tracking-wide mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="form-input w-full text-sm h-24 resize-y"
              placeholder="Describe what makes this preset unique"
            />
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{name}</p>
          <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80">
            {description ? description : <span className="italic">No description provided.</span>}
          </p>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-200 mb-2">Live Preview</p>
        <div className="rounded-lg border border-blue-200/70 dark:border-blue-800/70 bg-white dark:bg-bunker-900/80 p-3 text-sm text-blue-900 dark:text-blue-100 min-h-[3rem] whitespace-pre-wrap break-words">
          {previewText}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex flex-col gap-1">
          <Tooltip text={canUpdate ? 'Update the current preset with these changes' : updateDisabledReason || 'No changes to update'}>
            <div>
              <button
                onClick={onUpdate}
                disabled={!canUpdate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                <Icon name="save" className="w-4 h-4" />
                Update Current Preset
              </button>
            </div>
          </Tooltip>
          {!canUpdate && updateDisabledReason && (
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80">{updateDisabledReason}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Tooltip text={canSaveAsNew ? 'Save these changes as a new preset' : saveAsNewDisabledReason || 'Choose a unique name to save as new'}>
            <div>
              <button
                onClick={onSaveAsNew}
                disabled={!canSaveAsNew}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
              >
                <Icon name="plus" className="w-4 h-4" />
                Save as New Preset
              </button>
            </div>
          </Tooltip>
          {!canSaveAsNew && saveAsNewDisabledReason && (
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">{saveAsNewDisabledReason}</p>
          )}
          {saveAsNewConflictMessage && !nameErrorMessage && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{saveAsNewConflictMessage}</p>
          )}
        </div>
      </div>
    </section>
  );
};
