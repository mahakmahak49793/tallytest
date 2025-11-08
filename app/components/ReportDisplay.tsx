import { format } from 'date-fns';

interface ReportDisplayProps {
  data: any;
  reportType: string;
}

export default function ReportDisplay({ data, reportType }: ReportDisplayProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const renderDayBook = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Voucher Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Voucher No
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Party Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Narration
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.data.map((item: any) => (
            <tr key={item.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(item.date), 'dd/MM/yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.voucherType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.voucherNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.partyName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(item.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.narration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBalanceSheet = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Assets</h3>
        <div className="space-y-2">
          {data.data.assets.map((asset: any, index: number) => (
            <div key={index} className="flex justify-between border-b pb-2">
              <span>{asset.name}</span>
              <span className="font-medium">{formatCurrency(asset.amount)}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Liabilities</h3>
        <div className="space-y-2">
          {data.data.liabilities.map((liability: any, index: number) => (
            <div key={index} className="flex justify-between border-b pb-2">
              <span>{liability.name}</span>
              <span className="font-medium">{formatCurrency(liability.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfitLoss = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Income</h3>
        <div className="space-y-2">
          {data.data.income.map((item: any, index: number) => (
            <div key={index} className="flex justify-between border-b pb-2">
              <span>{item.name}</span>
              <span className="font-medium text-green-600">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-4">Expenses</h3>
        <div className="space-y-2">
          {data.data.expenses.map((item: any, index: number) => (
            <div key={index} className="flex justify-between border-b pb-2">
              <span>{item.name}</span>
              <span className="font-medium text-red-600">
                {formatCurrency(item.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLedgerSummary = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ledger Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Opening Balance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Debit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Credit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Closing Balance
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.data.map((ledger: any, index: number) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {ledger.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(ledger.openingBalance)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(ledger.debit)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatCurrency(ledger.credit)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatCurrency(ledger.closingBalance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderContent = () => {
    switch (reportType) {
      case 'dayBook':
        return renderDayBook();
      case 'salesRegister':
        return renderDayBook(); // Similar structure, adjust as needed
      case 'balanceSheet':
        return renderBalanceSheet();
      case 'profitLoss':
        return renderProfitLoss();
      case 'ledgerSummary':
        return renderLedgerSummary();
      default:
        return <div>No data available</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {data.reportType ? data.reportType.charAt(0).toUpperCase() + data.reportType.slice(1) : 'Report'}
        </h2>
        {data.fromDate && data.toDate && (
          <p className="text-gray-600">
            Period: {format(new Date(data.fromDate), 'dd/MM/yyyy')} - {format(new Date(data.toDate), 'dd/MM/yyyy')}
          </p>
        )}
        {data.totalRecords !== undefined && (
          <p className="text-gray-600">Total Records: {data.totalRecords}</p>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
}