import { useMemo } from 'react'

import { toast } from 'react-toastify'

import { ContentCopy as CopyIcon } from '@mui/icons-material'
import { alpha, Box, IconButton, Paper, styled, Tooltip } from '@mui/material'
import { RichTreeView } from '@mui/x-tree-view/RichTreeView'
import { TreeItem, treeItemClasses } from '@mui/x-tree-view/TreeItem'

import { BodyText } from '../fonts'

export interface TableAsJsonProps {
  /** JSON data to display in tree view */
  data: unknown
  /** Optional title for the tree view */
  title?: string
  /** Whether to show copy button */
  showCopyButton?: boolean
}

/**
 * Tree item data structure for RichTreeView
 */
interface TreeItemData {
  id: string
  label: string
  children?: TreeItemData[]
}

/**
 * Custom styled TreeItem matching MUI X documentation example
 */
const CustomTreeItem = styled(TreeItem)(({ theme }) => ({
  color: theme.palette.grey[200],
  [`& .${treeItemClasses.content}`]: {
    borderRadius: theme.spacing(0.5),
    padding: theme.spacing(0.5, 1),
    margin: theme.spacing(0.2, 0),
    [`& .${treeItemClasses.label}`]: {
      fontSize: '0.8rem',
      fontWeight: 500,
    },
  },
  [`& .${treeItemClasses.iconContainer}`]: {
    borderRadius: '50%',
    backgroundColor: theme.palette.primary.dark,
    padding: theme.spacing(0, 1.2),
    ...theme.applyStyles('light', {
      backgroundColor: alpha(theme.palette.primary.main, 0.25),
    }),
    ...theme.applyStyles('dark', {
      color: theme.palette.primary.contrastText,
    }),
  },
  [`& .${treeItemClasses.groupTransition}`]: {
    marginLeft: 15,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
  ...theme.applyStyles('light', {
    color: theme.palette.grey[800],
  }),
}))

/**
 * TableAsJson Component
 *
 * Displays JSON data in an interactive tree view using MUI X RichTreeView
 * Supports nested objects and arrays with expandable/collapsible nodes
 *
 * @example
 * <TableAsJson
 *   data={myJsonData}
 *   title="API Response"
 *   showCopyButton={true}
 * />
 */
export const TableAsJson = ({ data, title, showCopyButton = true }: TableAsJsonProps): JSX.Element => {
  /**
   * Convert JSON data to tree view items
   */
  const { treeItems, defaultExpandedIds } = useMemo((): { treeItems: TreeItemData[]; defaultExpandedIds: string[] } => {
    let nodeId = 0
    const expandedIds: string[] = []

    const generateId = (): string => {
      nodeId += 1
      return `node-${nodeId}`
    }

    const convertToTreeItem = (key: string, value: unknown, depth: number = 0): TreeItemData => {
      const id = generateId()
      const item: TreeItemData = {
        id,
        label: key,
      }

      if (value === null) {
        item.label = `${key}: null`
      } else if (value === undefined) {
        item.label = `${key}: undefined`
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          item.label = `${key} [${value.length}]`
          item.children = value.map((arrItem, index) => convertToTreeItem(`[${index}]`, arrItem, depth + 1))
          // Expand first two levels by default
          if (depth < 2) {
            expandedIds.push(id)
          }
        } else {
          const entries = Object.entries(value as Record<string, unknown>)
          item.label = `${key} {${entries.length}}`
          item.children = entries.map(([k, v]) => convertToTreeItem(k, v, depth + 1))
          // Expand first two levels by default
          if (depth < 2) {
            expandedIds.push(id)
          }
        }
      } else if (typeof value === 'string') {
        item.label = `${key}: "${value}"`
      } else if (typeof value === 'boolean') {
        item.label = `${key}: ${value}`
      } else if (typeof value === 'number') {
        item.label = `${key}: ${value}`
      } else {
        item.label = `${key}: ${String(value)}`
      }

      return item
    }

    /**
     * Get a display label for an array item
     * Uses loginName if available, otherwise falls back to index
     */
    const getArrayItemLabel = (item: unknown, index: number): string => {
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>
        // Use loginName as the label if available
        if (typeof obj.loginName === 'string' && obj.loginName) {
          return obj.loginName
        }
        // Fallback to name or id if available
        if (typeof obj.name === 'string' && obj.name) {
          return obj.name
        }
        if (typeof obj.id === 'string' || typeof obj.id === 'number') {
          return String(obj.id)
        }
      }
      return `[${index}]`
    }

    // Handle root level data
    let items: TreeItemData[]
    if (Array.isArray(data)) {
      items = data.map((item, index) => convertToTreeItem(getArrayItemLabel(item, index), item, 0))
    } else if (typeof data === 'object' && data !== null) {
      items = Object.entries(data as Record<string, unknown>).map(([key, value]) => convertToTreeItem(key, value, 0))
    } else {
      items = [
        {
          id: 'root',
          label: String(data),
        },
      ]
    }

    return {
      treeItems: items,
      defaultExpandedIds: expandedIds,
    }
  }, [data])

  /**
   * Copy JSON to clipboard
   */
  const handleCopyJson = async (): Promise<void> => {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(jsonString)
      toast.success('JSON copied to clipboard!')
    } catch {
      toast.error('Failed to copy JSON to clipboard')
    }
  }

  const hasTitle = Boolean(title)

  return (
    <Box>
      {/* Optional title above the card */}
      {hasTitle && (
        <BodyText variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </BodyText>
      )}

      {/* Tree View Card with Copy Button inside */}
      <Paper
        variant="outlined"
        sx={{
          position: 'relative',
          p: 2,
          minHeight: 200,
          maxHeight: 600,
          overflow: 'auto',
          backgroundColor: theme => (theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50'),
        }}
      >
        {/* Copy button in top right corner */}
        {showCopyButton && (
          <Tooltip title="Copy JSON to clipboard">
            <IconButton
              onClick={() => void handleCopyJson()}
              size="small"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                backgroundColor: theme => alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  backgroundColor: theme => alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ minWidth: 250, pt: showCopyButton ? 3 : 0 }}>
          <RichTreeView
            aria-label="JSON tree view"
            defaultExpandedItems={defaultExpandedIds}
            slots={{ item: CustomTreeItem }}
            items={treeItems}
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default TableAsJson
