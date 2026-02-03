import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button, Input, Checkbox } from "@/components/ui";
import { contactService } from "@/services/contactService";
import { useToast } from "@/components/ui/ToastProvider";

export interface AddContactDialogProps {
  isOpen: boolean;
  onClose: (contactId?: string) => void;
  initialValues?: {
    firstName?: string;
    lastName?: string;
  };
}

export const AddContactDialog = ({
  isOpen,
  onClose,
  initialValues,
}: AddContactDialogProps) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: initialValues?.firstName || "",
    lastName: initialValues?.lastName || "",
    email: "",
    phone: "",
    grnNumber: "",
    password: "",
    hasSignedWaiverForm: false,
    subscribeToMailingList: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setFormData({
        firstName: initialValues?.firstName || "",
        lastName: initialValues?.lastName || "",
        email: "",
        phone: "",
        grnNumber: "",
        password: "",
        hasSignedWaiverForm: false,
        subscribeToMailingList: false,
      });
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const validatePhone = (phone: string): boolean => {
    if (!phone) {
      return false;
    }
    const parts = phone.split("-");
    const local = parts.length === 2 ? parts[1] : phone;
    const digits = local.replace(/\D/g, "");
    return digits.length >= 6 && digits.length <= 10;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate phone number
    if (!formData.phone) {
      setErrors({ phone: "Phone number is required" });
      setIsLoading(false);
      return;
    }

    if (!validatePhone(formData.phone)) {
      setErrors({
        phone: "Phone number must be 6-10 digits (excluding country code)",
      });
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.firstName, // Set name from firstName
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone,
        grnNumber: formData.grnNumber || undefined,
        password: formData.password || undefined,
        hasSignedWaiverForm: formData.hasSignedWaiverForm,
        subscribeToMailingList: formData.subscribeToMailingList,
        detailedCustomFields: [],
      };

      const result = await contactService.addClient(payload);
      
      toast.success("Contact added successfully");
      onClose(result.id);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to add contact. Please try again.";
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Create Contact
          </h3>
          <button
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First name"
              disabled={isLoading}
              error={errors.firstName}
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last name"
              disabled={isLoading}
              error={errors.lastName}
            />
          </div>

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="email@example.com"
            disabled={isLoading}
            error={errors.email}
          />

          <Input
            label="Phone *"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Country code - Phone number"
            disabled={isLoading}
            error={errors.phone}
            required
          />

          <Input
            label="GRN Number"
            name="grnNumber"
            value={formData.grnNumber}
            onChange={handleInputChange}
            placeholder="GRN number (optional)"
            disabled={isLoading}
            error={errors.grnNumber}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password (optional)"
            disabled={isLoading}
            error={errors.password}
          />

          <div className="space-y-3 pt-2">
            <Checkbox
              id="hasSignedWaiverForm"
              name="hasSignedWaiverForm"
              checked={formData.hasSignedWaiverForm}
              onChange={handleInputChange}
              label="Has signed waiver form"
              disabled={isLoading}
            />
            <Checkbox
              id="subscribeToMailingList"
              name="subscribeToMailingList"
              checked={formData.subscribeToMailingList}
              onChange={handleInputChange}
              label="Subscribe to mailing list"
              disabled={isLoading}
            />
          </div>

          {errors.submit && (
            <div className="text-sm text-error-600 dark:text-error-400">
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onClose()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Contact"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
