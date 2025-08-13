import { toast } from 'react-toastify';

// Centralized notification helpers to enforce consistent UX across admin CRUD flows
export const notifySuccess = (msg, opts={}) => toast.success(msg, { position: 'top-right', autoClose: 3000, ...opts });
export const notifyError = (msg, opts={}) => toast.error(msg, { position: 'top-right', autoClose: 5000, ...opts });
export const notifyWarn = (msg, opts={}) => toast.warn(msg, { position: 'top-right', autoClose: 4000, ...opts });
export const notifyInfo = (msg, opts={}) => toast.info(msg, { position: 'top-right', autoClose: 3000, ...opts });

// Build standardized CRUD messages
export const buildCrudMessage = {
  create: (entity='Bản ghi') => `Thêm ${entity} thành công`,
  update: (entity='Bản ghi') => `Cập nhật ${entity} thành công`,
  delete: (entity='Bản ghi') => `Xóa ${entity} thành công`,
  error: (entity='Bản ghi') => `Thao tác với ${entity} thất bại`,
};

// Wrapper to run async action with auto success / error toasts
export async function runWithToast(promiseOrFn, { pendingMessage, successMessage, errorMessage, onSuccess, onError } = {}) {
  try {
    if (pendingMessage) notifyInfo(pendingMessage, { autoClose: 1200 });
    const result = typeof promiseOrFn === 'function' ? await promiseOrFn() : await promiseOrFn;
    if (successMessage) notifySuccess(successMessage);
    onSuccess?.(result);
    return { ok: true, result };
  } catch (e) {
    notifyError(errorMessage || (e.response?.data?.message) || e.message || 'Đã xảy ra lỗi');
    onError?.(e);
    return { ok: false, error: e };
  }
}

// Standard confirm helper (can swap to a modal lib later)
export function confirmAction({ message, onConfirm, onCancel }) {
  if (window.confirm(message)) {
    onConfirm?.();
    return true;
  } else {
    onCancel?.();
    return false;
  }
}
