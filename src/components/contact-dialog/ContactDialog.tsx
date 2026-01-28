import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, CircularProgress, Button } from '@mui/material';
import { X } from 'lucide-react';
import { contactService, ContactSearchResult } from '@/services/contactService';
import { usePreview } from '@/contexts/PreviewContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ContactDialog({ open, onClose }: ContactDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ContactSearchResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { enterPreviewMode } = usePreview();
  const navigate = useNavigate();

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedContact(null);
      setIsSearching(false);
      setIsLoading(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await contactService.searchContacts(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching contacts:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSubmit = async () => {
    if (!selectedContact) {
      return;
    }

    setIsLoading(true);
    try {
      // Store admin token for later restoration
      const adminToken = authService.accessToken;
      contactService.setAdminAuthTokenForPreview(adminToken);

      // Get student token
      const studentToken = await contactService.getContactToken(selectedContact.id);

      // Enter preview mode
      enterPreviewMode(
        {
          id: selectedContact.id,
          email: selectedContact.email || '',
          name: selectedContact.label,
        },
        studentToken,
        adminToken
      );

      // Set student token for API calls
      authService.accessToken = studentToken;

      // Navigate to student courses (equivalent to Angular's /classes route)
      navigate('/student/courses');
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error entering student preview:', error);
      alert('Failed to enter student preview. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedContact && !isLoading) {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '230px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Search</div>
          <div style={{ fontSize: '0.875rem', color: 'text.secondary', marginTop: '4px' }}>
            Select a member to add
          </div>
        </div>
        <Button
          onClick={onClose}
          sx={{ minWidth: 'auto', p: 1 }}
          aria-label="Close dialog"
        >
          <X size={20} />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Autocomplete
          options={searchResults}
          getOptionLabel={(option) => option.label || ''}
          inputValue={searchQuery}
          onInputChange={(_, newValue) => setSearchQuery(newValue)}
          onChange={(_, newValue) => setSelectedContact(newValue)}
          loading={isSearching}
          noOptionsText={searchQuery ? 'No contacts found' : 'Start typing to search...'}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={inputRef}
              placeholder="name or email or phone no."
              variant="outlined"
              fullWidth
              onKeyDown={handleKeyDown}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSearching ? <CircularProgress size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '40px',
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              <div>
                <div>{option.label}</div>
                {option.email && (
                  <div style={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                    {option.email}
                  </div>
                )}
              </div>
            </li>
          )}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedContact || isLoading}
          sx={{
            minWidth: '100px',
            bgcolor: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          {isLoading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            'Submit'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
