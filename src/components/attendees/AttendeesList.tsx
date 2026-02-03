import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Plus,
  Mail,
  MessageSquare,
  Eye,
  Trash2,
  ShoppingCart,
  Edit,
  X,
} from "lucide-react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmationDialog } from "@/components/ui";
import { attendeesService, Attendee } from "@/services/attendeesService";
import { Pagination } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import { usePreview } from "@/contexts/PreviewContext";
import { contactService } from "@/services/contactService";
import { authService } from "@/services/authService";
import { AddContactDialog } from "@/components/add-contact-dialog";
import { SendEmailDialog } from "@/components/send-email-dialog";

export interface AttendeesListProps {
  productId: string;
  productName: string;
  productType: "course" | "service" | "event";
  paymentType?: string;
  batches?: Array<{ guId: string; name: string }>;
  currentBatchId?: string | null;
  onBatchChange?: (batchId: string | null) => void;
}

export const AttendeesList = ({
  productId,
  productName,
  productType,
  paymentType,
  batches = [],
  currentBatchId,
  onBatchChange,
}: AttendeesListProps) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { enterPreviewMode } = usePreview();

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    currentBatchId || null,
  );
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
    totalRecords: 0,
  });
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(
    new Set(),
  );
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    onConfirm: () => void | Promise<void>;
  } | null>(null);
  const [deletingAttendeeId, setDeletingAttendeeId] = useState<string | null>(
    null,
  );
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAttendees();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, selectedBatchId, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    setSelectedBatchId(currentBatchId || null);
  }, [currentBatchId]);

  const loadAttendees = useCallback(async () => {
    setIsLoading(true);
    try {
      const formattedSearchText = searchText.toLowerCase().replace(/\s+/g, "");
      const result = await attendeesService.getAttendees(
        productId,
        productType,
        pagination.pageIndex,
        pagination.pageSize,
        formattedSearchText,
        selectedBatchId,
      );
      setAttendees(result.data || []);
      setPagination((prev) => ({
        ...prev,
        totalRecords: result.count || result.recordsTotal || 0,
      }));
    } catch (error: any) {
      toast.error(error.message || "Failed to load attendees");
    } finally {
      setIsLoading(false);
    }
  }, [
    productId,
    productType,
    searchText,
    selectedBatchId,
    pagination.pageIndex,
    pagination.pageSize,
    toast,
  ]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  const handleBatchChange = (batchId: string) => {
    setSelectedBatchId(batchId || null);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    if (onBatchChange) {
      onBatchChange(batchId || null);
    }
  };

  const handleDeleteAttendee = (attendee: Attendee) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Attendee",
      description: `Are you sure you want to remove ${attendee.firstName} ${attendee.lastName} from this ${productType}?`,
      confirmText: "Delete",
      variant: "danger",
      onConfirm: async () => {
        setDeletingAttendeeId(attendee.guId);
        try {
          await attendeesService.deleteAttendee(
            attendee.guId,
            productId,
            productType,
          );
          toast.success("Attendee removed successfully");
          await loadAttendees();
        } catch (error: any) {
          toast.error(error.message || "Failed to delete attendee");
        } finally {
          setDeletingAttendeeId(null);
        }
      },
    });
  };

  const handleStudentPreview = async (attendee: Attendee) => {
    try {
      const adminToken = authService.accessToken;
      if (adminToken) {
        contactService.setAdminAuthTokenForPreview(adminToken);
      }

      const studentToken = await contactService.getContactToken(attendee.guId);
      enterPreviewMode(
        {
          id: attendee.guId,
          email: attendee.email,
          name: `${attendee.firstName} ${attendee.lastName}`,
        },
        studentToken,
        adminToken || undefined,
      );

      authService.accessToken = studentToken;
      navigate("/student/courses");
    } catch (error: any) {
      toast.error(error.message || "Failed to enter student preview");
    }
  };

  const handleViewProfile = (attendee: Attendee) => {
    navigate(`/admin/contacts/${attendee.guId}/details`);
  };

  const handleAddContact = () => {
    setShowAddContactDialog(true);
  };

  const handleContactCreated = async (contactId: string) => {
    setShowAddContactDialog(false);
    try {
      // Automatically enroll the newly created contact as an attendee
      const payload = {
        productId,
        productType,
        contactId,
        productName,
        courseBatchId: selectedBatchId,
      };

      const newAttendee = await attendeesService.addAttendee(payload);
      toast.success("Attendee added successfully");
      
      // Refresh the attendees list
      await loadAttendees();
      
      // Optionally scroll to the new attendee or highlight it
    } catch (error: any) {
      toast.error(error.message || "Failed to add attendee");
    }
  };

  const getCurrencyCode = (currency: string | null | undefined): string => {
    return currency ? currency.toUpperCase() : "USD";
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: getCurrencyCode(currency),
    }).format(amount);
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Attendees{" "}
            {pagination.totalRecords > 0 && `(${pagination.totalRecords})`}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            An attendee gets added when a member registers himself or when staff
            adds member manually.
          </p>
        </div>
        <div className="flex items-center text-primary-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSendEmailDialog(true)}
            title="Send Email"
          >
            <Mail className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" title="Send Message">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone number"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          className="w-full sm:w-auto"
          onClick={handleAddContact}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
        {batches.length > 0 && (
          <Select
            value={selectedBatchId || ""}
            onValueChange={handleBatchChange}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.guId} value={batch.guId}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-sm text-slate-500">Loading attendees...</p>
          </div>
        ) : attendees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              No attendees found
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Batch
                    </th>
                    {paymentType === "PAID" && (
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                        Membership
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {attendees.map((attendee) => (
                    <tr
                      key={attendee.guId}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStudentPreview(attendee)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            aria-label="Student Preview"
                            title="Student Preview"
                          >
                            <Eye className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </button>
                          <button
                            onClick={() => handleViewProfile(attendee)}
                            className="text-slate-600 dark:text-slate-400 hover:underline font-medium"
                          >
                            {attendee.firstName} {attendee.lastName}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                        {attendee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-900 dark:text-white">
                            {attendee.courseBatch?.name || "N/A"}
                          </span>
                          {batches.length > 0 && (
                            <button
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              aria-label="Edit Batch"
                              title="Edit Batch"
                            >
                              <Edit className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                            </button>
                          )}
                        </div>
                      </td>
                      {paymentType === "PAID" && (
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 hidden lg:table-cell">
                          {attendee.membership ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">
                                  {attendee.membership.itemName.includes("/")
                                    ? attendee.membership.itemName.split("/")[1]
                                    : attendee.membership.itemName}
                                </span>
                                {attendee.membership.subscription && (
                                  <img
                                    src="https://passets.wajooba.ai/img/Autopay_01.png"
                                    alt="Recurring"
                                    className="h-4 w-4"
                                    title="Recurring Membership"
                                  />
                                )}
                              </div>
                              <div className="text-xs">
                                {attendee.membership.subscription
                                  ? formatCurrency(
                                      attendee.membership.subscription
                                        .subscriptionAmount,
                                      attendee.membership.currency,
                                    )
                                  : formatCurrency(
                                      attendee.membership.itemPrice,
                                      attendee.membership.currency,
                                    )}
                                {attendee.membership.subscription &&
                                  ` ${attendee.membership.subscription.frequency}`}
                              </div>
                              <div className="text-xs">
                                {formatDate(attendee.membership.startDate)} -{" "}
                                {formatDate(attendee.membership.endDate)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-secondary-500">UNPAID</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 hidden lg:table-cell">
                        {attendee.progress !== undefined ? (
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative">
                            <div
                              className="bg-primary-600 h-6 rounded-full flex items-center justify-center text-xs text-white"
                              style={{ width: `${attendee.progress}%` }}
                            >
                              {attendee.progress > 13
                                ? `${attendee.progress}%`
                                : ""}
                            </div>
                            {attendee.progress <= 13 && (
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-700 dark:text-slate-300">
                                {attendee.progress}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/admin/store?userId=${attendee.guId}&courseId=${productId}`,
                              )
                            }
                            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            aria-label="Store"
                            title="Store"
                          >
                            <ShoppingCart className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttendee(attendee)}
                            className="p-1.5 rounded hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors"
                            aria-label="Delete"
                            title="Delete"
                            disabled={deletingAttendeeId === attendee.guId}
                          >
                            <Trash2 className="h-4 w-4 text-secondary-500 dark:text-secondary-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalRecords > pagination.pageSize && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <Pagination
                  currentPage={pagination.pageIndex}
                  totalPages={Math.ceil(
                    pagination.totalRecords / pagination.pageSize,
                  )}
                  totalRecords={pagination.totalRecords}
                  pageSize={pagination.pageSize}
                  onPageChange={(page) =>
                    setPagination((prev) => ({ ...prev, pageIndex: page }))
                  }
                  onPageSizeChange={(size) =>
                    setPagination((prev) => ({
                      ...prev,
                      pageSize: size,
                      pageIndex: 0,
                    }))
                  }
                  pageSizeOptions={[10, 25, 50, 100]}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmationDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmText={confirmDialog.confirmText}
          variant={confirmDialog.variant}
          onConfirm={confirmDialog.onConfirm}
          isLoading={deletingAttendeeId !== null}
        />
      )}

      {/* Add Contact Dialog */}
      <AddContactDialog
        isOpen={showAddContactDialog}
        onClose={(contactId) => {
          if (contactId) {
            handleContactCreated(contactId);
          } else {
            setShowAddContactDialog(false);
          }
        }}
        initialValues={{
          firstName: searchText.split(/\s+/)[0] || "",
          lastName: searchText.split(/\s+/)[1] || "",
        }}
      />

      {/* Send Email Dialog */}
      <SendEmailDialog
        isOpen={showSendEmailDialog}
        onClose={(success) => {
          setShowSendEmailDialog(false);
          if (success) {
            // Optionally refresh attendees list or show success message
          }
        }}
        selectedContacts={Array.from(selectedAttendees).join(",")}
        productId={productId}
        productType={productType}
        batchId={selectedBatchId}
        productName={productName}
        noOfAttendees={pagination.totalRecords}
        toEmailLabel={
          selectedAttendees.size > 0
            ? `${selectedAttendees.size} Selected Contact${selectedAttendees.size !== 1 ? "s" : ""}`
            : `All Attendees of ${productName} (${pagination.totalRecords})`
        }
      />
    </div>
  );
};
