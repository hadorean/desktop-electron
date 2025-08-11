import express from 'express'
import { join } from 'path'
import { watch } from 'chokidar'

export class TemplateManager {
	private templateWatcher: ReturnType<typeof watch> | null = null
	private server: express.Application

	constructor(server: express.Application) {
		this.server = server
		this.setupTemplateEngine()
	}

	/**
	 * Sets up the EJS template engine with proper paths for dev/prod
	 */
	private setupTemplateEngine(): void {
		// Set EJS as template engine
		this.server.set('view engine', 'ejs')

		// Detect if we're running from built/packaged app
		const isPackaged = __dirname.includes('app.asar')
		const isDev = process.env.NODE_ENV === 'development' || (process.env.NODE_ENV !== 'production' && !isPackaged)

		let templatesPath: string
		if (isDev) {
			// Development: templates are in src/main/templates
			templatesPath = join(process.cwd(), 'src/main/templates')
		} else {
			// Production/Packaged: templates are in out/main/templates (relative to __dirname)
			templatesPath = join(__dirname, 'templates')
		}

		this.server.set('views', templatesPath)
		console.log('📄 Templates path:', templatesPath)
		console.log('📄 Is packaged:', isPackaged)
		console.log('📄 Is dev:', isDev)
		console.log('📄 __dirname:', __dirname)
	}

	/**
	 * Sets up template hot reload for development
	 */
	public setupHotReload(): void {
		const isPackaged = __dirname.includes('app.asar')
		const isDev = process.env.NODE_ENV === 'development' || (process.env.NODE_ENV !== 'production' && !isPackaged)
		const templatesPath = isDev ? join(process.cwd(), 'src/main/templates') : join(__dirname, 'templates')

		// Watch templates for changes
		this.templateWatcher = watch(join(templatesPath, '**/*.ejs'), {
			persistent: true,
			ignoreInitial: true
		})

		this.templateWatcher.on('change', (path: string) => {
			console.log(`📝 Template changed: ${path}`)
			this.clearCache().catch(console.error)
		})

		this.templateWatcher.on('add', (path: string) => {
			console.log(`📄 New template added: ${path}`)
			this.clearCache().catch(console.error)
		})

		console.log('🔄 Template hot reload enabled')
	}

	/**
	 * Clears the EJS template cache
	 */
	public async clearCache(): Promise<void> {
		// Clear EJS template cache
		const ejs = await import('ejs')
		ejs.clearCache()
		console.log('🗑️  Template cache cleared')
	}

	/**
	 * Gets the current templates path
	 */
	public getTemplatesPath(): string {
		return this.server.get('views') as string
	}

	/**
	 * Checks if we're in development mode
	 */
	public isDevelopmentMode(): boolean {
		const isPackaged = __dirname.includes('app.asar')
		return process.env.NODE_ENV === 'development' || (process.env.NODE_ENV !== 'production' && !isPackaged)
	}

	/**
	 * Stops the template watcher
	 */
	public stop(): void {
		if (this.templateWatcher) {
			this.templateWatcher.close()
			console.log('🔄 Template watcher stopped')
		}
	}
}
