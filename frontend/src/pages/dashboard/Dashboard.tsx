import React from "react";

const mockTransactions = [
  { date: "2026-02-12", merchant: "Amazon", category: "Shopping", amount: "$89.99" },
  { date: "2026-02-11", merchant: "Starbucks", category: "Food & Drink", amount: "$5.45" },
  { date: "2026-02-10", merchant: "Uber", category: "Transportation", amount: "$23.50" },
  { date: "2026-02-09", merchant: "Whole Foods", category: "Groceries", amount: "$124.30" },
  { date: "2026-02-08", merchant: "Netflix", category: "Entertainment", amount: "$15.99" },
];

const barHeights = [65, 80, 45, 90, 70, 55, 85, 60, 75, 50, 88, 68];

export const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <section className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-2 text-lg">Here's your expense overview.</p>
        </section>

              {/* Quick Actions Section */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md mb-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Quick Actions</h2>
          <p className="text-slate-500 text-sm mb-6">Common tasks to manage your expenses</p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium">
              Upload Bill
            </button>
            <button className="bg-white border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-medium">
              Add Expense
            </button>
            <button className="bg-white border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-medium">
              View Reports
            </button>
            <button className="bg-white border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-medium">
              Tax Insights
            </button>
          </div>
        </section>

        {/* Stats Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900">$2,340</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Total Expenses</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900">$1,245</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">This Month</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-4xl font-bold text-slate-900">127</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Total Bills</p>
          </div>
        </section>



        {/* Recent Transactions Section */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Transactions</h2>
              <p className="text-slate-500 text-sm mt-1">Your latest expense entries</p>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-sm">Date</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">Merchant</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">Category</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((transaction, index) => (
                  <tr
                    key={index}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                  >
                    <td className="py-4 px-4 text-slate-700">{transaction.date}</td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-slate-900">{transaction.merchant}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-900">{transaction.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


      </div>
    </div>
  );
};

export default Dashboard;
