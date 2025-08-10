import { readdir } from 'fs/promises'
import { join } from 'path'

export class ImageService {
  public readonly IMAGES_PATH = 'D:\\pictures\\wall'
  private readonly SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif']

  /**
   * Scans the images directory for supported image files
   * @returns Array of relative image paths
   */
  public async scanForImages(): Promise<string[]> {
    try {
      console.log('Scanning for images in:', this.IMAGES_PATH)
      const allFiles: string[] = []

      // Helper function to recursively scan directories
      const scanDirectory = async (dirPath: string): Promise<void> => {
        const items = await readdir(dirPath, { withFileTypes: true, recursive: false })

        for (const item of items) {
          const fullPath = join(dirPath, item.name)

          if (item.isDirectory()) {
            // Recursively scan subdirectories
            // await scanDirectory(fullPath)
          } else if (item.isFile()) {
            // Check if file has a supported image extension
            const ext = item.name.toLowerCase().substring(item.name.lastIndexOf('.'))
            if (this.SUPPORTED_EXTENSIONS.includes(ext)) {
              // Store relative path from images directory
              const relativePath = fullPath.replace(this.IMAGES_PATH, '').replace(/^[\\/]/, '')
              allFiles.push(relativePath.replace(/\\/g, '/')) // Normalize path separators
            }
          }
        }
      }

      await scanDirectory(this.IMAGES_PATH)
      return allFiles.sort()
    } catch (error) {
      console.error('Error scanning images directory:', error)
      return []
    }
  }

  /**
   * Gets the list of supported image extensions
   */
  public getSupportedExtensions(): string[] {
    return [...this.SUPPORTED_EXTENSIONS]
  }

  /**
   * Gets the images directory path
   */
  public getImagesPath(): string {
    return this.IMAGES_PATH
  }
}

// Export singleton instance
export const imageService = new ImageService()
