'use client';

import { useState } from 'react';
import { Button, Input, Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { Search, UserPlus, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { usePreview } from '@/contexts/PreviewContext';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';
import { environment } from '@/config/environment';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department?: string;
  location?: string;
  status?: 'active' | 'inactive';
  picture?: string;
  fullName?: string;
}

export function ContactsSection() {
  const { enterPreviewMode } = usePreview();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // Real student contact data
  const contacts: Contact[] = [
    {
      id: 'Bn0bMmmG7R',
      name: 'Deepak',
      fullName: 'Deepak Bobade',
      email: 'madcollegeboy@gmail.com',
      phone: '+91-6789004680',
      role: 'ROLE_STUDENT',
      picture: 'https://res.cloudinary.com/dy1q4oxdv/image/upload/marksampletest-9xP0p480zR/dcubtj0ihdgiadgjopbe.png',
      status: 'active'
    }
  ];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm);
    return matchesSearch;
  });

  const previewStudent = async (contact: Contact) => {
    if (contact.role === 'ROLE_STUDENT' && user) {
      setIsPreviewing(true);
      setPreviewError(''); // Clear any previous errors
      
      try {
        // Store current admin token
        const adminToken = authService.accessToken;
        
        // Get student preview token from API
        const studentToken = await getStudentPreviewToken(contact.id);
        
        if (studentToken) {
                     // Enter preview mode with student data and tokens
           enterPreviewMode(
             {
               id: contact.id,
               name: contact.fullName || contact.name,
               email: contact.email,
               role: contact.role
             },
             studentToken,
             adminToken
           );
          
          // Switch to student dashboard view
          navigate('/student/dashboard');
        }
      } catch (error) {
        console.error('Failed to enter preview mode:', error);
        setPreviewError('Failed to preview student. Please try again.');
      } finally {
        setIsPreviewing(false);
      }
    }
  };

  // Get student preview token from API
  const getStudentPreviewToken = async (studentId: string): Promise<string> => {
    try {
      const response = await fetch(`${environment.api.baseUrl}/rest/contact/${studentId}/token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get student token: ${response.status}`);
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting student preview token:', error);
      throw error;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Student Contacts
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and preview student information
            </p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

             {/* Search */}
       <div className="p-6 border-b border-gray-200 dark:border-gray-700">
         <div className="flex flex-col sm:flex-row gap-4">
           <div className="flex-1">
             <Input
               placeholder="Search contacts by name, email, or phone..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full"
             />
           </div>
         </div>
       </div>

             {/* Error Display */}
       {previewError && (
         <div className="px-6 pt-4">
           <Alert variant="destructive">
             <AlertTitle>Preview Error</AlertTitle>
             <AlertDescription>{previewError}</AlertDescription>
           </Alert>
         </div>
       )}

       {/* Contacts List */}
       <div className="p-6">
         <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                             <div className="flex items-center space-x-4">
                 {contact.picture ? (
                   <img 
                     src={contact.picture} 
                     alt={contact.fullName || contact.name}
                     className="w-12 h-12 rounded-full object-cover"
                   />
                 ) : (
                   <div className="w-12 h-12 bg-deep-100 dark:bg-deep-900 rounded-full flex items-center justify-center">
                     <span className="text-deep-600 dark:text-deep-400 font-semibold text-lg">
                       {(contact.fullName || contact.name).charAt(0)}
                     </span>
                   </div>
                 )}
                 <div>
                   <div className="flex items-center space-x-2">
                     <h4 className="font-medium text-gray-900 dark:text-white">
                       {contact.fullName || contact.name}
                     </h4>
                     <span className={`inline-flex items-center justify-center min-w-[60px] h-6 px-2 text-xs rounded-full ${
                       contact.status === 'active' 
                         ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                         : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                     }`}>
                       {contact.status || 'active'}
                     </span>
                   </div>
                   <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                     <div className="flex items-center space-x-1">
                       <Mail className="h-3 w-3" />
                       <span>{contact.email}</span>
                     </div>
                     <div className="flex items-center space-x-1">
                       <Phone className="h-3 w-3" />
                       <span>{contact.phone}</span>
                     </div>
                   </div>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     Student ID: {contact.id}
                   </p>
                 </div>
               </div>
              
              <div className="flex items-center space-x-2">
                {contact.role === 'ROLE_STUDENT' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => previewStudent(contact)}
                    disabled={isPreviewing}
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isPreviewing ? 'Previewing...' : 'Preview'}
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <Alert variant="info" className="mt-4">
            <Search className="h-4 w-4" />
            <AlertTitle>No contacts found</AlertTitle>
            <AlertDescription>
              Try adjusting your search terms or department filter.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
