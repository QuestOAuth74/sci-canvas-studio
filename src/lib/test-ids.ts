/**
 * Test IDs for E2E testing
 *
 * Organized by feature/page for easy navigation.
 * Use these enums in both components (data-testid) and tests (getByTestId).
 *
 * Naming convention: {domain}-{component}-{element}-{type}
 * - Enum keys: SCREAMING_SNAKE_CASE
 * - Enum values: kebab-case
 */

/**
 * Auth page test IDs
 * Used in: src/pages/Auth.tsx
 */
export enum AuthTestIds {
  // Sign-in form
  SIGNIN_EMAIL_INPUT = 'auth-signin-email-input',
  SIGNIN_PASSWORD_INPUT = 'auth-signin-password-input',
  SIGNIN_SUBMIT_BUTTON = 'auth-signin-submit-button',
  SIGNIN_ERROR_EMAIL = 'auth-signin-error-email',
  SIGNIN_ERROR_PASSWORD = 'auth-signin-error-password',

  // Sign-up form
  SIGNUP_NAME_INPUT = 'auth-signup-name-input',
  SIGNUP_EMAIL_INPUT = 'auth-signup-email-input',
  SIGNUP_PASSWORD_INPUT = 'auth-signup-password-input',
  SIGNUP_COUNTRY_SELECT = 'auth-signup-country-select',
  SIGNUP_FIELD_SELECT = 'auth-signup-field-select',
  SIGNUP_SUBMIT_BUTTON = 'auth-signup-submit-button',
  SIGNUP_ERROR_NAME = 'auth-signup-error-name',
  SIGNUP_ERROR_EMAIL = 'auth-signup-error-email',
  SIGNUP_ERROR_PASSWORD = 'auth-signup-error-password',
  SIGNUP_ERROR_COUNTRY = 'auth-signup-error-country',
  SIGNUP_ERROR_FIELD = 'auth-signup-error-field',

  // Password reset flow
  RESET_EMAIL_INPUT = 'auth-reset-email-input',
  RESET_SEND_BUTTON = 'auth-reset-send-button',
  RESET_BACK_BUTTON = 'auth-reset-back-button',
  RESET_ERROR_EMAIL = 'auth-reset-error-email',

  // Password update flow
  UPDATE_PASSWORD_INPUT = 'auth-update-password-input',
  UPDATE_CONFIRM_INPUT = 'auth-update-confirm-input',
  UPDATE_SUBMIT_BUTTON = 'auth-update-submit-button',
  UPDATE_ERROR_PASSWORD = 'auth-update-error-password',
  UPDATE_ERROR_CONFIRM = 'auth-update-error-confirm',

  // Tab navigation
  TAB_SIGNIN = 'auth-tab-signin',
  TAB_SIGNUP = 'auth-tab-signup',

  // Links
  FORGOT_PASSWORD_LINK = 'auth-forgot-password-link',

  // General errors
  ERROR_MESSAGE = 'auth-error-message',
}

/**
 * Verify Email page test IDs
 * Used in: src/pages/VerifyEmail.tsx
 */
export enum VerifyEmailTestIds {
  HEADING = 'verify-email-heading',
  EMAIL_DISPLAY = 'verify-email-email-display',
  VERIFICATION_MESSAGE = 'verify-email-verification-message',
  RESEND_BUTTON = 'verify-email-resend-button',
  BACK_TO_SIGNIN_BUTTON = 'verify-email-back-to-signin-button',
}

/**
 * Navigation test IDs
 * Used in: src/components/auth/UserMenu.tsx
 */
export enum NavigationTestIds {
  USER_MENU_TRIGGER = 'navigation-user-menu-trigger',
  SIGNOUT_BUTTON = 'navigation-signout-button',
}

/**
 * Toast notification test IDs
 * Used in: src/lib/toast-helpers.ts, src/components/ui/custom-toast.tsx
 */
export enum ToastTestIds {
  // Auth toasts
  AUTH_SIGNIN_SUCCESS = 'toast-auth-signin-success',
  AUTH_SIGNIN_ERROR = 'toast-auth-signin-error',
  AUTH_SIGNUP_SUCCESS = 'toast-auth-signup-success',
  AUTH_SIGNUP_ERROR = 'toast-auth-signup-error',
  AUTH_SIGNOUT_SUCCESS = 'toast-auth-signout-success',
  AUTH_SIGNOUT_ERROR = 'toast-auth-signout-error',
  AUTH_EMAIL_UNVERIFIED = 'toast-auth-email-unverified',

  // Password reset toasts
  PASSWORD_RESET_SENT_SUCCESS = 'toast-password-reset-sent-success',
  PASSWORD_RESET_SENT_ERROR = 'toast-password-reset-sent-error',
  PASSWORD_UPDATE_SUCCESS = 'toast-password-update-success',
  PASSWORD_UPDATE_ERROR = 'toast-password-update-error',

  // Verify email toasts
  VERIFY_EMAIL_RESEND_SUCCESS = 'toast-verify-email-resend-success',
  VERIFY_EMAIL_RESEND_ERROR = 'toast-verify-email-resend-error',
}

/**
 * Projects page test IDs
 * Used in: src/pages/Projects.tsx
 */
export enum ProjectsTestIds {
  // Page container
  PAGE_CONTAINER = 'projects-page-container',

  // Header
  PAGE_TITLE = 'projects-page-title',
  NEW_PROJECT_BUTTON = 'projects-new-project-button',
  SEARCH_INPUT = 'projects-search-input',

  // Filters
  FILTER_ALL = 'projects-filter-all',
  FILTER_PUBLIC = 'projects-filter-public',
  FILTER_PRIVATE = 'projects-filter-private',

  // Project cards
  PROJECT_CARD = 'projects-project-card',
  PROJECT_TITLE = 'projects-project-title',
  PROJECT_OPEN_BUTTON = 'projects-project-open-button',
  PROJECT_DELETE_BUTTON = 'projects-project-delete-button',
  PROJECT_SHARE_BUTTON = 'projects-project-share-button',

  // Pagination
  PAGINATION = 'projects-pagination',

  // Empty state
  EMPTY_STATE = 'projects-empty-state',
}

/**
 * Community page test IDs
 * Used in: src/pages/Community.tsx
 */
export enum CommunityTestIds {
  // Page container
  PAGE_CONTAINER = 'community-page-container',

  // Header
  PAGE_TITLE = 'community-page-title',
  SEARCH_INPUT = 'community-search-input',

  // Sorting/Filters
  SORT_RECENT = 'community-sort-recent',
  SORT_POPULAR = 'community-sort-popular',
  SORT_CLONED = 'community-sort-cloned',
  SORT_LIKED = 'community-sort-liked',

  // Project cards
  PROJECT_CARD = 'community-project-card',
  PROJECT_TITLE = 'community-project-title',
  PROJECT_AUTHOR = 'community-project-author',
  PROJECT_VIEW_BUTTON = 'community-project-view-button',
  PROJECT_LIKE_BUTTON = 'community-project-like-button',
  PROJECT_CLONE_BUTTON = 'community-project-clone-button',

  // Stats
  STATS_TOTAL_PROJECTS = 'community-stats-total-projects',
  STATS_TOTAL_VIEWS = 'community-stats-total-views',
  STATS_TOTAL_LIKES = 'community-stats-total-likes',

  // Pagination
  PAGINATION = 'community-pagination',
}

/**
 * Admin page test IDs
 * Used in: src/pages/Admin.tsx
 */
export enum AdminTestIds {
  // Page container
  PAGE_CONTAINER = 'admin-page-container',

  // Header
  PAGE_TITLE = 'admin-page-title',
  NOTIFICATION_BELL = 'admin-notification-bell',
  NOTIFICATION_COUNT = 'admin-notification-count',

  // Navigation buttons
  AI_SETTINGS_BUTTON = 'admin-ai-settings-button',
  POWERPOINT_BUTTON = 'admin-powerpoint-button',
  RATE_LIMITS_BUTTON = 'admin-rate-limits-button',
  ANALYTICS_BUTTON = 'admin-analytics-button',
  EMAIL_BUTTON = 'admin-email-button',

  // Sections
  SUBMITTED_PROJECTS_SECTION = 'admin-submitted-projects-section',
  TESTIMONIALS_SECTION = 'admin-testimonials-section',
  ICON_SUBMISSIONS_SECTION = 'admin-icon-submissions-section',
  CONTACT_MESSAGES_SECTION = 'admin-contact-messages-section',
  TOOL_FEEDBACK_SECTION = 'admin-tool-feedback-section',
}

/**
 * Contact page test IDs
 * Used in: src/pages/Contact.tsx
 */
export enum ContactTestIds {
  // Page container
  PAGE_CONTAINER = 'contact-page-container',

  // Form
  FORM = 'contact-form',
  EMAIL_INPUT = 'contact-email-input',
  NAME_INPUT = 'contact-name-input',
  COUNTRY_INPUT = 'contact-country-input',
  MESSAGE_TEXTAREA = 'contact-message-textarea',
  SUBMIT_BUTTON = 'contact-submit-button',

  // Validation
  ERROR_EMAIL = 'contact-error-email',
  ERROR_NAME = 'contact-error-name',
  ERROR_COUNTRY = 'contact-error-country',
  ERROR_MESSAGE = 'contact-error-message',

  // Success
  SUCCESS_MESSAGE = 'contact-success-message',
}

/**
 * Blog page test IDs
 * Used in: src/pages/Blog.tsx
 */
export enum BlogTestIds {
  // Page container
  PAGE_CONTAINER = 'blog-page-container',

  // Header
  PAGE_TITLE = 'blog-page-title',
  SEARCH_INPUT = 'blog-search-input',

  // Post cards
  POST_CARD = 'blog-post-card',
  POST_TITLE = 'blog-post-title',
  POST_EXCERPT = 'blog-post-excerpt',
  POST_READ_MORE = 'blog-post-read-more',

  // Categories/Tags
  CATEGORY_FILTER = 'blog-category-filter',
  TAG_FILTER = 'blog-tag-filter',

  // Pagination
  PAGINATION = 'blog-pagination',
}

/**
 * Author Profile page test IDs
 * Used in: src/pages/AuthorProfile.tsx
 */
export enum AuthorProfileTestIds {
  // Page container
  PAGE_CONTAINER = 'author-profile-page-container',

  // Profile info
  PROFILE_NAME = 'author-profile-name',
  PROFILE_BIO = 'author-profile-bio',
  PROFILE_AVATAR = 'author-profile-avatar',
  PROFILE_COUNTRY = 'author-profile-country',
  PROFILE_FIELD = 'author-profile-field',

  // Stats
  STAT_PROJECTS = 'author-profile-stat-projects',
  STAT_VIEWS = 'author-profile-stat-views',
  STAT_LIKES = 'author-profile-stat-likes',

  // Projects section
  PROJECTS_SECTION = 'author-profile-projects-section',
  PROJECT_CARD = 'author-profile-project-card',
}

/**
 * Canvas Editor test IDs
 * Used in: src/pages/Canvas.tsx, src/components/canvas/*
 */
export enum CanvasEditorTestIds {
  // Page & Canvas
  PAGE_CONTAINER = 'canvas-editor-page-container',
  CANVAS_ELEMENT = 'canvas-editor-canvas-element',
  CANVAS_WRAPPER = 'canvas-editor-canvas-wrapper',

  // Toolbar
  TOOLBAR = 'canvas-editor-toolbar',
  UNDO_BUTTON = 'canvas-editor-undo-button',
  REDO_BUTTON = 'canvas-editor-redo-button',

  // Tools
  SELECT_TOOL = 'canvas-editor-select-tool',
  RECTANGLE_TOOL = 'canvas-editor-rectangle-tool',
  CIRCLE_TOOL = 'canvas-editor-circle-tool',
  TEXT_TOOL = 'canvas-editor-text-tool',
  LINE_TOOL = 'canvas-editor-line-tool',

  // Grid & Snapping
  GRID_TOGGLE = 'canvas-editor-grid-toggle',
  SNAP_TO_GRID_TOGGLE = 'canvas-editor-snap-to-grid-toggle',

  // Layers Panel
  LAYERS_PANEL = 'canvas-editor-layers-panel',
  LAYER_ITEM = 'canvas-editor-layer-item',
  LAYER_VISIBILITY_TOGGLE = 'canvas-editor-layer-visibility-toggle',
  LAYER_LOCK_TOGGLE = 'canvas-editor-layer-lock-toggle',

  // Properties Panel
  PROPERTIES_PANEL = 'canvas-editor-properties-panel',
  OBJECT_WIDTH_INPUT = 'canvas-editor-object-width-input',
  OBJECT_HEIGHT_INPUT = 'canvas-editor-object-height-input',
  OBJECT_X_INPUT = 'canvas-editor-object-x-input',
  OBJECT_Y_INPUT = 'canvas-editor-object-y-input',

  // Selection & Grouping
  SELECTED_OBJECT = 'canvas-editor-selected-object',
  MULTI_SELECTION = 'canvas-editor-multi-selection',
  GROUP_BUTTON = 'canvas-editor-group-button',
  UNGROUP_BUTTON = 'canvas-editor-ungroup-button',
}

/**
 * Icon Library test IDs
 * Used in: src/components/canvas/IconLibrary.tsx
 */
export enum IconLibraryTestIds {
  LIBRARY_PANEL = 'icon-library-panel',
  LIBRARY_TOGGLE = 'icon-library-toggle',
  SEARCH_INPUT = 'icon-library-search-input',
  CATEGORY_FILTER = 'icon-library-category-filter',
  ICON_ITEM = 'icon-library-icon-item',
  UPLOAD_BUTTON = 'icon-library-upload-button',
  UPLOAD_DIALOG = 'icon-library-upload-dialog',
  UPLOAD_FILE_INPUT = 'icon-library-upload-file-input',
  DELETE_ICON_BUTTON = 'icon-library-delete-icon-button',
  LOADING_INDICATOR = 'icon-library-loading-indicator',
}

/**
 * Export Dialog test IDs
 * Used in: src/components/canvas/ExportDialog.tsx
 */
export enum ExportDialogTestIds {
  DIALOG = 'export-dialog',
  DIALOG_TRIGGER = 'export-dialog-trigger',

  // Format selection
  FORMAT_PNG = 'export-format-png',
  FORMAT_JPEG = 'export-format-jpeg',
  FORMAT_SVG = 'export-format-svg',
  FORMAT_PDF = 'export-format-pdf',

  // DPI options
  DPI_150 = 'export-dpi-150',
  DPI_300 = 'export-dpi-300',
  DPI_600 = 'export-dpi-600',

  // JPEG quality
  QUALITY_SLIDER = 'export-quality-slider',
  QUALITY_VALUE = 'export-quality-value',

  // PDF options
  CMYK_MODE_TOGGLE = 'export-cmyk-mode-toggle',

  // Export button
  EXPORT_BUTTON = 'export-export-button',
  CANCEL_BUTTON = 'export-cancel-button',
}

/**
 * Canvas Size Dialog test IDs
 * Used in: src/components/canvas/CustomCanvasDialog.tsx
 */
export enum CanvasSizeTestIds {
  SIZE_DIALOG = 'canvas-size-dialog',
  SIZE_DIALOG_TRIGGER = 'canvas-size-dialog-trigger',

  // Dimensions
  WIDTH_INPUT = 'canvas-size-width-input',
  HEIGHT_INPUT = 'canvas-size-height-input',

  // Units
  UNIT_SELECT = 'canvas-size-unit-select',
  UNIT_INCHES = 'canvas-size-unit-inches',
  UNIT_CM = 'canvas-size-unit-cm',
  UNIT_PX = 'canvas-size-unit-px',

  // Actions
  APPLY_BUTTON = 'canvas-size-apply-button',
  CANCEL_BUTTON = 'canvas-size-cancel-button',
}

/**
 * Annotation Tools test IDs
 * Used in: src/components/canvas/AnnotationTools.tsx
 */
export enum AnnotationTestIds {
  // Numbered callouts
  CALLOUT_TOOL = 'annotation-callout-tool',
  CALLOUT_NUMBER = 'annotation-callout-number',

  // Leader lines
  LEADER_LINE_TOOL = 'annotation-leader-line-tool',
  LEADER_LINE_TEXT = 'annotation-leader-line-text',

  // Presets
  PRESET_ARROW_TEXT = 'annotation-preset-arrow-text',
  PRESET_BRACKET_LABEL = 'annotation-preset-bracket-label',

  // Legend generator
  LEGEND_GENERATOR_BUTTON = 'annotation-legend-generator-button',
  LEGEND_OUTPUT = 'annotation-legend-output',
}

/**
 * Share Dialog test IDs
 * Used in: src/components/projects/ShareDialog.tsx
 */
export enum ShareDialogTestIds {
  DIALOG = 'share-dialog',
  DIALOG_TRIGGER = 'share-dialog-trigger',
  SHARE_URL = 'share-share-url',
  COPY_LINK_BUTTON = 'share-copy-link-button',
  PUBLIC_TOGGLE = 'share-public-toggle',
}
