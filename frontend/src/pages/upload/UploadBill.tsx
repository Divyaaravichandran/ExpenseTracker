import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBills, uploadBill } from "../../services/bills.service";
import { Receipt } from "../../types/bill";

const UploadBill = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bills, setBills] = useState<Receipt[]>([]);
  const [listLoading, setListLoading] = useState(false);

  const loadBills = async () => {
    setListLoading(true);
    try {
      const data = await getBills();
      setBills(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load bills");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadBills();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose an image file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadBill(file);
      setSuccess("Bill uploaded successfully");
      setFile(null);
      await loadBills();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to upload bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Upload Bill</h1>
          <p className="text-slate-600 mt-2">Upload receipt image and store it in your account.</p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Upload Bill"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="border border-slate-300 px-5 py-2.5 rounded-lg hover:bg-slate-100"
              >
                Back
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Show All Bills</h2>
          {listLoading ? <p className="mt-4 text-slate-500">Loading bills...</p> : null}

          {!listLoading && bills.length === 0 ? <p className="mt-4 text-slate-500">No bills uploaded yet.</p> : null}

          {bills.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="text-left py-3">Uploaded At</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill._id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-800">{new Date(bill.uploadedAt).toLocaleString()}</td>
                      <td className="py-3 text-slate-800">{bill.status}</td>
                      <td className="py-3">
                        {bill.imageUrl ? (
                          <a href={`${((import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL || "http://localhost:4000")}${bill.imageUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            View Image
                          </a>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default UploadBill;