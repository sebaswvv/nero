/**
 * Downloads an Excel export file for the specified ledger.
 * This includes all transactions (variable and income) and recurring items
 * from the past year.
 */
export async function downloadExcelExport(
  ledgerId: string,
  onError: (message: string) => void
): Promise<boolean> {
  try {
    const params = new URLSearchParams({ ledgerId });
    const res = await fetch(`/api/export?${params}`, {
      credentials: "include",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.message ?? "Failed to export transactions");
    }

    // Download the file
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const today = new Date().toISOString().split("T")[0];
    a.download = `transactions-export-${today}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return true;
  } catch (e) {
    onError((e as Error).message);
    return false;
  }
}
