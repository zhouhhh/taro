declare const navigateTo: (options: any) => Promise<unknown>;
declare const redirectTo: (options: any) => Promise<unknown>;
declare function navigateBack(): Promise<unknown>;
declare function switchTab(): void;
declare function reLaunch(): void;
export { navigateTo, redirectTo, navigateBack, switchTab, reLaunch };
