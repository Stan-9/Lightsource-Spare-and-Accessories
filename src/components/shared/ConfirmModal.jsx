import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal — replaces window.confirm() throughout the app.
 * Usage:
 *   <ConfirmModal
 *     isOpen={confirmOpen}
 *     title="Delete Product?"
 *     message="This cannot be undone."
 *     confirmLabel="Delete"
 *     confirmClassName="bg-red-500 hover:bg-red-600 text-white"
 *     onConfirm={() => { doAction(); setConfirmOpen(false); }}
 *     onCancel={() => setConfirmOpen(false)}
 *   />
 */
const ConfirmModal = ({
  isOpen,
  title = 'Are you sure?',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmClassName = 'bg-red-500 hover:bg-red-600 text-white',
  onConfirm,
  onCancel,
  icon: Icon = AlertTriangle,
  iconClassName = 'text-red-500',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0`}>
            <Icon className={`w-6 h-6 ${iconClassName}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-white mb-1">{title}</h3>
            {message && <p className="text-gray-400 text-sm leading-relaxed">{message}</p>}
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl font-bold text-gray-300 hover:bg-gray-800 transition text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-black text-sm transition ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
