import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface UserExportData {
  id: string;
  email: string;
  full_name: string;
  country: string | null;
  field_of_study: string | null;
  created_at: string;
  last_login_at: string | null;
  project_count: number;
  storage_mb?: number;
}

export const exportUsersToExcel = (users: UserExportData[], customFilename?: string) => {
  const excelData = users.map((user, index) => ({
    '#': index + 1,
    'Full Name': user.full_name || 'Not provided',
    'Email': user.email,
    'Country': user.country || 'Not specified',
    'Field of Study': user.field_of_study || 'Not specified',
    'Total Projects': user.project_count,
    'Storage (MB)': user.storage_mb !== undefined ? user.storage_mb : 'N/A',
    'Join Date': format(new Date(user.created_at), 'MMM dd, yyyy'),
    'Last Login': user.last_login_at ? format(new Date(user.last_login_at), 'MMM dd, yyyy HH:mm') : 'Never',
    'User ID': user.id
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 5 },   // #
    { wch: 25 },  // Full Name
    { wch: 35 },  // Email
    { wch: 20 },  // Country
    { wch: 25 },  // Field of Study
    { wch: 15 },  // Total Projects
    { wch: 14 },  // Storage (MB)
    { wch: 15 },  // Join Date
    { wch: 18 },  // Last Login
    { wch: 40 }   // User ID
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
  const filename = customFilename 
    ? `${customFilename}_${timestamp}.xlsx`
    : `BioSketch_Users_${timestamp}.xlsx`;

  XLSX.writeFile(workbook, filename);
};
