import { useState, useEffect } from "react";
import { X, Mail, Settings } from "lucide-react";
import { Button, Input, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import { emailService, TenantEmail } from "@/services/emailService";
import { useToast } from "@/components/ui/ToastProvider";
import { useNavigate } from "react-router-dom";
import appLoadService from "@/app/core/app-load";

export interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: (success?: boolean) => void;
  selectedContacts?: string; // Comma-separated contact IDs
  productId?: string;
  productType?: "course" | "service" | "event" | "contacts";
  batchId?: string | null;
  productName?: string;
  noOfAttendees?: number;
  toEmailLabel?: string; // Custom label for the "To" field
}

export const SendEmailDialog = ({
  isOpen,
  onClose,
  selectedContacts,
  productId,
  productType,
  batchId,
  productName,
  noOfAttendees,
  toEmailLabel,
}: SendEmailDialogProps) => {
  const toast = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emails, setEmails] = useState<TenantEmail[]>([]);
  const [formData, setFormData] = useState({
    from: "",
    to: "",
    cc: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tenantId, setTenantId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadEmailProviders();
      initializeForm();
      loadTenantId();
    }
  }, [isOpen, selectedContacts, productName, noOfAttendees]);

  const loadTenantId = async () => {
    try {
      const tenant = await appLoadService.initAppConfig();
      if (tenant?.tenantId) {
        setTenantId(tenant.tenantId);
      }
    } catch (error) {
      console.error("Error loading tenant ID:", error);
    }
  };

  const loadEmailProviders = async () => {
    setIsLoading(true);
    try {
      const providers = await emailService.getProvidersEmail();
      setEmails(providers);
      if (providers.length > 0 && !formData.from) {
        setFormData((prev) => ({ ...prev, from: providers[0].userName }));
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load email providers");
    } finally {
      setIsLoading(false);
    }
  };

  const initializeForm = () => {
    let toValue = "";
    
    if (productType && productType !== "contacts") {
      // For courses/services/events, show product name and attendee count
      toValue = `All Attendees of ${productName || "Product"} (${noOfAttendees || 0})`;
    } else if (selectedContacts) {
      // For selected contacts
      const contactCount = selectedContacts.split(",").filter((id) => id.trim()).length;
      toValue = `${contactCount} Selected Contact${contactCount !== 1 ? "s" : ""}`;
    } else {
      toValue = toEmailLabel || "All contacts";
    }

    setFormData({
      from: emails[0]?.userName || "",
      to: toValue,
      cc: "",
      subject: "",
      message: "",
    });
    setErrors({});
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email.trim());
  };

  const validateCC = (cc: string): boolean => {
    if (!cc) return true; // CC is optional
    const emails = cc.split(",").map((e) => e.trim());
    return emails.every((email) => validateEmail(email));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFromChange = (value: string) => {
    setFormData((prev) => ({ ...prev, from: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validation
    if (!formData.from) {
      setErrors({ from: "Please select a sender email" });
      setIsLoading(false);
      return;
    }

    if (!formData.subject) {
      setErrors({ subject: "Subject is required" });
      setIsLoading(false);
      return;
    }

    if (!formData.message) {
      setErrors({ message: "Message is required" });
      setIsLoading(false);
      return;
    }

    if (formData.cc && !validateCC(formData.cc)) {
      setErrors({ cc: "Please enter valid email addresses, separated by commas" });
      setIsLoading(false);
      return;
    }

    try {
      const selectedEmail = emails.find((e) => e.userName === formData.from);
      if (!selectedEmail) {
        throw new Error("Selected email provider not found");
      }

      if (!tenantId) {
        throw new Error("Tenant ID is required. Please refresh the page and try again.");
      }

      const payload: any = {
        providerId: selectedEmail._id,
        tenantId: tenantId,
        cc: formData.cc || undefined,
        subject: formData.subject,
        toEmail: formData.to, // Use the "to" field value (which is read-only display)
        emailBody: formData.message,
      };

      // Set product-related fields based on productType
      if (productType && productType !== "contacts") {
        payload.productId = productId;
        payload.productType = productType;
        payload.toEmail = ""; // Empty for product-based emails (sends to all attendees)
      }

      if (productType === "course" && batchId) {
        payload.batchId = batchId;
        payload.toEmail = ""; // Empty for batch-based emails
      }

      if (productType === "contacts") {
        if (selectedContacts) {
          // For selected contacts, use the contact IDs directly
          // Note: In Angular, this uses data.selectedContactsEmails if available
          payload.toEmail = selectedContacts;
        } else {
          payload.productId = "-1";
          payload.toEmail = ""; // Empty means all contacts
        }
      }

      // If no tagId and no productId, set toEmail to empty
      if (!payload.tagId && !payload.productId) {
        payload.toEmail = "";
      }

      await emailService.sendEmail(payload);
      
      toast.success("Email sent successfully!");
      onClose(true);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to send email. Please try again.";
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

  const handleNavigateToSettings = () => {
    navigate("/admin/settings/integrations");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Send Email
            </h3>
          </div>
          <button
            onClick={() => !isLoading && onClose()}
            disabled={isLoading}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-4 text-sm text-slate-500">Loading email providers...</p>
            </div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <img
                src="https://res.cloudinary.com/wajooba/image/upload/v1734677193/master/no-files.jpg"
                alt="No email provider"
                className="h-32 w-auto mb-6"
              />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No email provider is connected to this tenant.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Please configure the email provider to avail the service.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleNavigateToSettings}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Configure Email Provider
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  From *
                </label>
                <Select
                  value={formData.from}
                  onValueChange={handleFromChange}
                >
                  <SelectTrigger className={errors.from ? "border-error-500 dark:border-error-400" : ""}>
                    <SelectValue placeholder="Select sender email" />
                  </SelectTrigger>
                  <SelectContent>
                    {emails.map((email) => (
                      <SelectItem key={email._id} value={email.userName}>
                        {email.userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.from && (
                  <p className="text-sm text-error-600 dark:text-error-400 mt-1">{errors.from}</p>
                )}
              </div>

              <Input
                label="To/Bcc"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                disabled
                className="bg-slate-50 dark:bg-slate-900"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
                When sending to a list of contacts, emails will be sent in BCC (limit: 150 emails)
              </p>

              <Input
                label="Cc"
                name="cc"
                type="email"
                value={formData.cc}
                onChange={handleInputChange}
                placeholder="email1@example.com, email2@example.com"
                disabled={isLoading}
                error={errors.cc}
              />

              <Input
                label="Subject *"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Email subject"
                disabled={isLoading}
                error={errors.subject}
                required
              />

              <Textarea
                label="Message *"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message here..."
                disabled={isLoading}
                error={errors.message}
                rows={8}
                required
              />

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
                  disabled={isLoading || !formData.from || !formData.subject || !formData.message}
                >
                  {isLoading ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
