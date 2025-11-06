// Course type definitions based on API structure

export interface Course {
  guId: string;
  id: string;
  name: string;
  shortDescription: string;
  longDescription?: string;
  url: string;
  image1?: string;
  paymentType: 'PAID' | 'FREE' | 'DONATION' | 'EXTERNAL';
  isShowOnWebsite: boolean;
  isOnlineCourse: boolean;
  categoryType: 'SERVICE' | 'course' | 'service' | 'nodeitemcategory';
  dateCreated: number;
  dateUpdated: number;
  dateCreatedStr: string;
  dateUpdatedStr: string;
  durationStr?: string;
  tid: string;
  tenantId: number;
  categoryId: number;
  sequence: number;
  classColor?: string;
  authorId?: string;
  authorType?: string;
  isDisabled: boolean;
  isFranchiseCourse: boolean;
  isMasterCourse?: boolean;
  isAllowDemoChapters: boolean;
  registrationFormId: string;
  productTagList: string[];
  quizList: string[];
  highlightsList: Array<{
    value: string;
    editing?: boolean;
  }>;
  isCOPPACompliant: boolean;
  // Optional marketing/email fields
  additionalAdminEmailsCsv?: string;
  adminCategoryCompletionTemplateId?: string;
  wemailTemplateId?: string;
  isSendWelcomeEmail?: boolean;
  registrationSuccessPageTemplateId?: string;
  upsellProductList?: Array<{
    id: string;
    productType: string;
    name: string;
  }>;
}

export interface CoursesResponse {
  c: number;
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: Course[];
  wemail: {};
}

export interface CourseFilters {
  start: number;
  max: number;
  search?: string;
  type?: string;
  include?: string;
  draw?: string;
  isShowAll?: boolean;
  isShowArchived?: boolean;
}

