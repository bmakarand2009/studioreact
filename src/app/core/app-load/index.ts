/**
 * App Load Service
 *
 * This service handles the initial application configuration by making a ping call
 * to get tenant details based on the current domain, similar to wisely-ui.
 */

import { environment } from '@/config/environment';

// Types for tenant details
export interface TenantDetails {
  address: Address;
  buyButtonLabel: string;
  cloudName: string;
  country: string;
  csymbol: string;
  customDomain: string;
  email: string;
  environmentName: string;
  isEnableCourses: boolean;
  isMasterFranchise: boolean;
  isShowCalenderView: boolean;
  isShowCourses: boolean;
  isShowDonation: boolean;
  isShowOnlineZoomMeeting: boolean;
  isShowRegistrationLink: boolean;
  isShowRoomName: boolean;
  isShowSchedule: boolean;
  isShowScheduleMenu: boolean;
  isShowSidebar: boolean;
  isShowStoreMenu: boolean;
  isShowWorkshops: boolean;
  isSupportGrn: boolean;
  isTermsAgreed: boolean;
  isWaiverFormToBeSigned: boolean;
  logo: string;
  masterOrgId: string;
  name: string;
  notificationOnesignalAppId: string;
  orgGuId: string;
  orgId: string;
  phone: string;
  privacyPolicyLink: string;
  promotionLabel: string;
  registerButtonLabel: string;
  registrationLinkName: string;
  scheduleLabel: string;
  tenantAuthViewCmd: TenantAuthViewCmd;
  tenantId: string; // This is what we need for login!
  termsOfServiceLink: string;
  timezone: string;
  version: string;
  waiverFormLink: string;
  workshopLabel: string;
  web: Web[];
  socials: Social[];
  org: Org;
  forms: Form[];
}

export interface Address {
  line1: string;
  line2: string;
}

export interface Form {
  afterForm: AfterForm | null;
  beforeForm: AfterForm | null;
  customFields: CustomFieldElement[] | null;
  customFormName: null | string;
  date: number;
  guId: string;
  header: null | string;
  isCustomForm: boolean;
  isEmail: boolean | null;
  isMasterForm: null;
  isName: boolean | null;
  isPhone: boolean | null;
  isPublishToStudent: boolean | null;
  isShowAddress: boolean;
  isShowBirthdate: boolean;
  isShowEmergencyContact: boolean;
  isShowOnWebsite: boolean;
  isSignRequired: boolean | null;
  name: string;
  subHeader: AfterForm | null;
  type: FormType;
}

export interface AfterForm {
  description: string;
  guId: string;
}

export interface CustomFieldElement {
  sequence: number;
  customField: CustomFieldData;
}

export interface CustomFieldData {
  customForm: null | string;
  guId: string;
  isDisabled: boolean;
  isFormField: boolean;
  isListOnWebsite: boolean;
  isMandatory: boolean;
  name: string;
  option1: null | string;
  option2: null | string;
  option3: null | string;
  option4: null | string;
  option5: null | string;
  option6: null | string;
  placeholder: null | string;
  sequence: number;
  tag: null | string;
  type: CustomFieldType;
}

export enum CustomFieldType {
  Checkbox = "checkbox",
  Dropdown = "dropdown",
  Header = "header",
  Number = "number",
  Radio = "radio",
  Text = "text",
}

export enum FormType {
  StudentRegistration = "STUDENT_REGISTRATION",
}

export interface Org {
  logo: string;
  logoWidth: number;
  logoHeight: number;
  isScaleLogo: boolean;
  favIcon: string;
  headerColor: string;
  pageScript: string;
  title: string;
  seoDescription: string;
  googleId: string;
  isShowFooter: boolean;
  footerInfo: string;
  tosLink: string;
  privacyPolicyLink: string;
  favIconUrl: string;
}

export interface Social {
  name: string;
  value: string;
}

export interface TenantAuthViewCmd {
  clientId: string;
  domain: string;
}

export interface Web {
  name: string;
  title: string;
  url: string;
  externalLink: null | string;
  isExternalLink: boolean;
  header: null | string;
  subHeader: null | string;
  footer: null | string;
  sequence: number;
  isShowNavigation: boolean;
  isShowFooter: boolean;
}

// App Load Service
export class AppLoadService {
  private _allowedDomains = ['wajooba.me', 'onwajooba.com', 'me.com', 'localhost', '127.0.0.1'];
  private _tenantDetails: TenantDetails | null = null;
  private _isFirstInitialization = true;
  private _isInitializing = false;
  private _initializationPromise: Promise<TenantDetails | null> | null = null;
  private _hostName: string;
  private _hostId: string;

  constructor() {
    this._hostName = typeof window !== 'undefined' ? window.location.hostname : '';
    // For development, use a default host ID if we can't extract one
    this._hostId = this._hostName.split('.')[0] || 'dev';
  }

  /**
   * Initialize app configuration by making ping call (runs only once)
   */
  public async initAppConfig(): Promise<TenantDetails | null> {
    console.log(`AppLoadService: Initializing with hostname: ${this._hostName}, hostId: ${this._hostId}`);
    
    // If already initialized, return cached result
    if (this._tenantDetails) {
      console.log('AppLoadService: Already initialized, returning cached result');
      return this._tenantDetails;
    }

    // If currently initializing, wait for that promise
    if (this._isInitializing && this._initializationPromise) {
      console.log('AppLoadService: Currently initializing, waiting for existing promise');
      return this._initializationPromise;
    }

    // If not initialized, start initialization
    if (!this._isInitializing) {
      console.log('AppLoadService: Starting initialization');
      this._isInitializing = true;
      this._initializationPromise = this._performInitialization();
    }

    return this._initializationPromise;
  }

  /**
   * Perform the actual initialization (private method)
   */
  private async _performInitialization(): Promise<TenantDetails | null> {
    try {
      // Check if current hostname is in allowed domains
      // For development, allow localhost and 127.0.0.1
      const isDevelopment = this._hostName === 'localhost' || this._hostName === '127.0.0.1' || this._hostName.startsWith('localhost:');
      const isAllowedDomain = this._allowedDomains.some((domain) => this._hostName.endsWith(domain));
      
      console.log(`AppLoadService: Domain check - isDevelopment: ${isDevelopment}, isAllowedDomain: ${isAllowedDomain}`);
      
      if (!isDevelopment && !isAllowedDomain) {
        console.log('AppLoadService: Domain not allowed, aborting initialization');
        this._isInitializing = false;
        return null;
      }

      const url = `${environment.api.baseUrl}/snode/tenant/ping?name=${this._hostId}`;
      console.log(`AppLoadService: Making ping request to: ${url}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const details: TenantDetails = await response.json();
      console.log('AppLoadService: Successfully received tenant details:', details);
      this._tenantDetails = details;
      this._isFirstInitialization = false;
      this._isInitializing = false;
      
      return details;
    } catch (error) {
      console.error('AppLoadService: Initialization error:', error);
      this._isInitializing = false;
      return null;
    }
  }

  /**
   * Get current tenant details
   */
  public get tenantDetails(): TenantDetails | null {
    return this._tenantDetails;
  }

  /**
   * Get current tenant ID
   */
  public get tenantId(): string | null {
    return this._tenantDetails?.tenantId || null;
  }

  /**
   * Check if this is the first initialization
   */
  public get isFirstInitialization(): boolean {
    return this._isFirstInitialization;
  }

  /**
   * Check if currently initializing
   */
  public get isInitializing(): boolean {
    return this._isInitializing;
  }

  /**
   * Check if initialization is complete
   */
  public get isInitialized(): boolean {
    return this._tenantDetails !== null;
  }

  /**
   * Update host ID
   */
  public updateHostId(newHostId: string): void {
    this._hostId = newHostId;
  }

  /**
   * Force re-initialization (useful for testing or domain changes)
   */
  public async reinitialize(): Promise<TenantDetails | null> {
    this._tenantDetails = null;
    this._isFirstInitialization = true;
    this._isInitializing = false;
    this._initializationPromise = null;
    return this.initAppConfig();
  }
}

// Export singleton instance
export const appLoadService = new AppLoadService();
export default appLoadService;
