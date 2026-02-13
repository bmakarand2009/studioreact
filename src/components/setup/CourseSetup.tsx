import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button, ToggleSlider, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Textarea, Input } from '@/components/ui';
import { setupService, EmailTemplate, CustomForm, Test, Product } from '@/services/setupService';
import { courseDetailService } from '@/services/courseDetailService';
import { useToast } from '@/components/ui/ToastProvider';
import appLoadService, { TenantDetails } from '@/app/core/app-load';

export interface CourseSetupProps {
  productInfo: any;
  isMasterTenant?: boolean;
  isFranchiseCourse?: boolean;
  onSettingsUpdated?: () => void;
}

interface QuizItem {
  quizId: string;
}

export function CourseSetup({
  productInfo,
  isMasterTenant = false,
  isFranchiseCourse = false,
  onSettingsUpdated,
}: CourseSetupProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [filteredTests, setFilteredTests] = useState<Test[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);

  // Form state
  const [isOnlineCourse, setIsOnlineCourse] = useState(false);
  const [isAllowDemoChapters, setIsAllowDemoChapters] = useState(false);
  const [registrationFormId, setRegistrationFormId] = useState('');
  const [isCOPPACompliant, setIsCOPPACompliant] = useState(false);
  const [isFranchiseCourseEnabled, setIsFranchiseCourseEnabled] = useState(false);
  const [quizList, setQuizList] = useState<QuizItem[]>([]);
  const [registrationSuccessPageTemplateId, setRegistrationSuccessPageTemplateId] = useState('');
  const [upsellProductList, setUpsellProductList] = useState<string[]>([]);
  const [isSendWelcomeEmail, setIsSendWelcomeEmail] = useState(false);
  const [wemailTemplateId, setWemailTemplateId] = useState('');
  const [registrationAdminNotification, setRegistrationAdminNotification] = useState(false);
  const [adminWEmailTemplateId, setAdminWEmailTemplateId] = useState('');
  const [completionAttendeeNotification, setCompletionAttendeeNotification] = useState(false);
  const [userCategoryCompletionTemplateId, setUserCategoryCompletionTemplateId] = useState('');
  const [completionAdminNotification, setCompletionAdminNotification] = useState(false);
  const [adminCategoryCompletionTemplateId, setAdminCategoryCompletionTemplateId] = useState('');
  const [additionalEmailNotification, setAdditionalEmailNotification] = useState(false);
  const [additionalAdminEmailsCsv, setAdditionalAdminEmailsCsv] = useState('');
  const [testSearch, setTestSearch] = useState('');

  const productType = 'course'; // For courses, it's always 'course'

  useEffect(() => {
    loadInitialData();
    bindForm();
  }, [productInfo]);

  useEffect(() => {
    filterTests(testSearch);
  }, [testSearch, tests]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const tenant = await appLoadService.initAppConfig();
      setTenantDetails(tenant);
      
      const [templates, forms, testsData, products] = await Promise.all([
        setupService.getEmailTemplates(),
        setupService.getCustomFormsByType('STUDENT_REGISTRATION'),
        setupService.getAllTests(),
        setupService.getProductsList('course,merchandise,pbundle'),
      ]);

      setEmailTemplates(templates);
      setCustomForms(forms);
      setTests(testsData);
      setFilteredTests(testsData);
      
      const allProducts = [...products.courses, ...products.merchandise, ...products.bundles];
      setProductList(allProducts);
    } catch (error) {
      console.error('Error loading setup data:', error);
      toast.error('Failed to load setup data');
    } finally {
      setIsLoading(false);
    }
  };

  const bindForm = () => {
    if (!productInfo) return;

    const wemail = productInfo.wemail || {};
    
    setIsOnlineCourse(productInfo.isOnlineCourse || false);
    setIsAllowDemoChapters(productInfo.isAllowDemoChapters || false);
    setRegistrationFormId(productInfo.registrationFormId || '');
    setIsCOPPACompliant(wemail.isCOPPACompliant || false);
    setIsFranchiseCourseEnabled(productInfo.isFranchiseCourse || false);
    setRegistrationSuccessPageTemplateId(wemail.registrationSuccessPageTemplateId || '');
    setUpsellProductList(wemail.upsellProductList?.map((p: any) => p.id || p.guId) || []);
    setIsSendWelcomeEmail(wemail.isSendWelcomeEmail || false);
    setWemailTemplateId(wemail.wemailTemplateId || '');
    setRegistrationAdminNotification(!!wemail.adminWEmailTemplateId);
    setAdminWEmailTemplateId(wemail.adminWEmailTemplateId || '');
    setCompletionAttendeeNotification(!!wemail.userCategoryCompletionTemplateId);
    setUserCategoryCompletionTemplateId(wemail.userCategoryCompletionTemplateId || '');
    setCompletionAdminNotification(!!wemail.adminCategoryCompletionTemplateId);
    setAdminCategoryCompletionTemplateId(wemail.adminCategoryCompletionTemplateId || '');
    setAdditionalEmailNotification(!!wemail.additionalAdminEmailsCsv);
    setAdditionalAdminEmailsCsv(wemail.additionalAdminEmailsCsv || '');
    
    // Quiz list
    if (wemail.quizList && wemail.quizList.length > 0) {
      setQuizList(wemail.quizList.map((quizId: string) => ({ quizId })));
    } else {
      setQuizList([]);
    }
  };

  const filterTests = (search: string) => {
    if (!search) {
      setFilteredTests(tests);
      return;
    }
    setFilteredTests(
      tests.filter((test) => test.name?.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const addEmptyQuizList = () => {
    setQuizList([...quizList, { quizId: '' }]);
  };

  const removeQuizItem = async (index: number) => {
    const newList = quizList.filter((_, i) => i !== index);
    setQuizList(newList);
    // Only submit if there are valid quiz items, otherwise just update the list
    if (newList.length > 0 && newList.every((item) => item.quizId)) {
      await handleSubmit(newList);
    }
  };

  const updateQuizItem = (index: number, quizId: string) => {
    const newList = [...quizList];
    newList[index].quizId = quizId;
    setQuizList(newList);
  };

  const handleSubmit = useCallback(async (updatedQuizList?: QuizItem[]) => {
    const currentQuizList = updatedQuizList || quizList;
    
    // Validate quiz list - only if there are items
    if (currentQuizList.length > 0 && currentQuizList.some((item) => !item.quizId)) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        adminCategoryCompletionTemplateId: completionAdminNotification
          ? adminCategoryCompletionTemplateId
          : null,
        additionalAdminEmailsCsv: additionalEmailNotification
          ? additionalAdminEmailsCsv
          : null,
        adminWEmailTemplateId: registrationAdminNotification
          ? adminWEmailTemplateId
          : null,
        isAllowDemoChapters,
        isCOPPACompliant,
        isFranchiseCourse: isMasterTenant ? isFranchiseCourseEnabled : productInfo.isFranchiseCourse,
        isOnlineCourse,
        isSendWelcomeEmail,
        name: productInfo.name,
        registrationFormId,
        registrationSuccessPageTemplateId,
        userCategoryCompletionTemplateId: completionAttendeeNotification
          ? userCategoryCompletionTemplateId
          : null,
        wemailTemplateId,
        upsellProductList: productList
          .filter((item) => upsellProductList.includes(item.guId))
          .map((product) => ({
            id: product.guId,
            name: product.name,
            productType: product.categoryType,
          })),
        quizData: currentQuizList.map((item) => item.quizId),
      };

      await courseDetailService.updateEmail(productInfo.guId, payload);
      toast.success('Updated Successfully');
      onSettingsUpdated?.();
    } catch (error: any) {
      console.error('Error updating email settings:', error);
      toast.error(error?.error?.errors?.message || 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    quizList,
    completionAdminNotification,
    adminCategoryCompletionTemplateId,
    additionalEmailNotification,
    additionalAdminEmailsCsv,
    registrationAdminNotification,
    adminWEmailTemplateId,
    isAllowDemoChapters,
    isCOPPACompliant,
    isMasterTenant,
    isFranchiseCourseEnabled,
    productInfo,
    isOnlineCourse,
    isSendWelcomeEmail,
    registrationFormId,
    registrationSuccessPageTemplateId,
    completionAttendeeNotification,
    userCategoryCompletionTemplateId,
    wemailTemplateId,
    upsellProductList,
    productList,
    toast,
    onSettingsUpdated,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Registration and Course Access */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Registration and {productType.charAt(0).toUpperCase() + productType.slice(1)} Access
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Show Course Contents
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                You can add contents like downloads, and digital content.
              </p>
            </div>
            <ToggleSlider
              checked={isOnlineCourse}
              onCheckedChange={(checked: boolean) => {
                setIsOnlineCourse(checked);
                handleSubmit();
              }}
              aria-label="Online course"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Introductory Session Registration
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Allows user registration for an introductory session.
              </p>
            </div>
            <ToggleSlider
              checked={isAllowDemoChapters}
              onCheckedChange={(checked: boolean) => {
                setIsAllowDemoChapters(checked);
                handleSubmit();
              }}
              aria-label="Allow demo chapters"
            />
          </div>

          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              Custom Registration Form
              {registrationFormId && (
                <a
                  href={`/customforms/${registrationFormId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-primary-500 hover:text-primary-500 inline-flex items-center"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Review Form
                </a>
              )}
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Select and customize the registration form for relevant information gathering.
            </p>
            <Select
              value={registrationFormId}
              onValueChange={(value) => {
                setRegistrationFormId(value);
                handleSubmit();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select registration form" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {customForms.map((form) => (
                  <SelectItem key={form.guId} value={form.guId}>
                    {form.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pre-Registration Options */}
      <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Pre-Registration Options
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                COPPA Compliance
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Ensure your {productType} adheres to COPPA, safeguarding children under 13.
              </p>
            </div>
            <ToggleSlider
              checked={isCOPPACompliant}
              onCheckedChange={(checked: boolean) => {
                setIsCOPPACompliant(checked);
                handleSubmit();
              }}
              aria-label="COPPA compliant"
            />
          </div>

          {tenantDetails?.isMasterFranchise && (
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Enable Franchise Sharing
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Make {productType} available to franchises.
                </p>
              </div>
              <ToggleSlider
                checked={isFranchiseCourseEnabled}
                disabled={!isMasterTenant}
                onCheckedChange={(checked: boolean) => {
                  setIsFranchiseCourseEnabled(checked);
                  handleSubmit();
                }}
                aria-label="Franchise course"
              />
            </div>
          )}
        </div>
      </div>

      {/* Associate Assessments */}
      <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Associate Assessments
        </h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Assigned assessments will be assigned to the member when the course is published.
          </p>
          
          <div className="w-full md:w-1/2">
            <Input
              type="text"
              placeholder="Search assessments..."
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
            />
          </div>
          
          <div className="space-y-3">
            {quizList.map((quiz, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <Select
                    value={quiz.quizId}
                    onValueChange={(value) => {
                      updateQuizItem(index, value);
                      handleSubmit();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Assessment" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTests.map((test) => (
                        <SelectItem key={test._id} value={test._id}>
                          {test.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeQuizItem(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                {index === quizList.length - 1 && (
                  <Button variant="primary" size="sm" onClick={addEmptyQuizList}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                )}
              </div>
            ))}
            
            {quizList.length === 0 && (
              <Button variant="primary" onClick={addEmptyQuizList}>
                <Plus className="h-4 w-4 mr-2" />
                Add Assessment
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Post Purchase */}
      <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Post Purchase
        </h2>
        
        <div className="space-y-4">
          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              Success Screen Template
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Select a template for a success screen.
            </p>
            <Select
              value={registrationSuccessPageTemplateId}
              onValueChange={(value) => {
                setRegistrationSuccessPageTemplateId(value);
                handleSubmit();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Registration Success Screen template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {emailTemplates.map((template) => (
                  <SelectItem key={template._id} value={template._id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
              Upsell Product
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Select Products to upsell
            </p>
            <Select
              value=""
              onValueChange={(value) => {
                if (value && !upsellProductList.includes(value)) {
                  const newList = [...upsellProductList, value];
                  setUpsellProductList(newList);
                  handleSubmit();
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Products for upsell" />
              </SelectTrigger>
              <SelectContent>
                {productList
                  .filter((product) => !upsellProductList.includes(product.guId))
                  .map((product) => (
                    <SelectItem key={product.guId} value={product.guId}>
                      {product.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {upsellProductList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {upsellProductList.map((productId) => {
                  const product = productList.find((p) => p.guId === productId);
                  return (
                    <span
                      key={productId}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                    >
                      {product?.name}
                      <button
                        onClick={() => {
                          setUpsellProductList(upsellProductList.filter((id) => id !== productId));
                          handleSubmit();
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Email Notifications */}
      <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Welcome Email Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Welcome Email for Attendees
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Activates personalized welcome emails for new attendees.
              </p>
            </div>
            <ToggleSlider
              checked={isSendWelcomeEmail}
              onCheckedChange={(checked: boolean) => {
                setIsSendWelcomeEmail(checked);
                handleSubmit();
              }}
              aria-label="Send welcome email"
            />
          </div>

          {isSendWelcomeEmail && (
            <div className="w-full md:w-1/2">
              <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                Welcome Email
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Select a template to notify attendees upon registration
              </p>
              <Select
                value={wemailTemplateId}
                onValueChange={(value) => {
                  setWemailTemplateId(value);
                  handleSubmit();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Welcome Email template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Registration Notification for Admins
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Notifies Admin when a new attendee registers for course.
              </p>
            </div>
            <ToggleSlider
              checked={registrationAdminNotification}
              onCheckedChange={(checked: boolean) => {
                setRegistrationAdminNotification(checked);
                handleSubmit();
              }}
              aria-label="Registration admin notification"
            />
          </div>

          {registrationAdminNotification && (
            <div className="w-full md:w-1/2">
              <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                Registration Notification for Admins
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Select a template to notify admins upon registration
              </p>
              <Select
                value={adminWEmailTemplateId}
                onValueChange={(value) => {
                  setAdminWEmailTemplateId(value);
                  handleSubmit();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Welcome Email template" />
                </SelectTrigger>
                <SelectContent>
                  {emailTemplates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Additional Emails for Admin Notifications */}
      <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Additional Emails for Admin Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Enable Additional Email Recipients for Admin Notifications
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Allows you to specify additional emails to which you would like to send a copy of admin emails
              </p>
            </div>
            <ToggleSlider
              checked={additionalEmailNotification}
              onCheckedChange={(checked: boolean) => {
                setAdditionalEmailNotification(checked);
                handleSubmit();
              }}
              aria-label="Additional email notification"
            />
          </div>

          {additionalEmailNotification && (
            <div className="w-full md:w-1/2">
              <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                Additional Email Recipients (incl. Custom Tags)
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Add additional comma(,) separated emails or use custom tags (e.g. {`{{ doctoremail }}`}) to notify along with admins
              </p>
              <div className="flex gap-2">
                <Textarea
                  value={additionalAdminEmailsCsv}
                  onChange={(e) => setAdditionalAdminEmailsCsv(e.target.value)}
                  placeholder="Additional emails"
                  className="flex-1"
                />
                <Button
                  variant="primary"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
