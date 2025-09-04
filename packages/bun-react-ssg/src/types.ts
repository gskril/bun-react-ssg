import { Metadata } from './html'

/**
 * Result type for generateStaticParams function in dynamic routes.
 * Enforces type safety for the three allowed properties.
 */
export interface GenerateStaticParamsResult {
	/** Dynamic route parameters (e.g., { id: "123" }) */
	params: Record<string, string>
	/** Optional props to pass to the page component */
	props?: Record<string, any>
	/** Optional metadata to override the static metadata export */
	metadata?: Metadata
}