let openSheets = 0;

export function setSheetOpenState(isOpen: boolean) {
  if (typeof document === 'undefined') {
    return;
  }

  if (isOpen) {
    openSheets += 1;
  } else {
    openSheets = Math.max(0, openSheets - 1);
  }

  document.body.classList.toggle('sheet-open', openSheets > 0);
}
