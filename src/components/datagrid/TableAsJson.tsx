import { useMemo } from 'react'

import { toast } from 'react-toastify'

import { ContentCopy as CopyIcon } from '@mui/icons-material'
import AddBoxRoundedIcon from '@mui/icons-material/AddBoxRounded'
import DisabledByDefaultRoundedIcon from '@mui/icons-material/DisabledByDefaultRounded'
import IndeterminateCheckBoxRoundedIcon from '@mui/icons-material/IndeterminateCheckBoxRounded'
import { Box, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView'
import { TreeItem } from '@mui/x-tree-view/TreeItem'

import styles from '../../styles/DataGrid.module.scss'

export interface TableAsJsonProps {
  /** JSON data to display in tree view */
  data: unknown
  /** Optional title for the tree view */
  title?: string
  /** Whether to show copy button */
  showCopyButton?: boolean
}

/**
 * Expand icon component
 */
const ExpandIcon = (): JSX.Element => <AddBoxRoundedIcon className={styles['table-as-json__expand-icon']} />

/**
 * Collapse icon component
 */
const CollapseIcon = (): JSX.Element => (
  <IndeterminateCheckBoxRoundedIcon className={styles['table-as-json__collapse-icon']} />
)

/**
 * End icon component (for leaf nodes)
 */
const EndIcon = (): JSX.Element => <DisabledByDefaultRoundedIcon className={styles['table-as-json__end-icon']} />

/**
 * Tree item data structure
 */
interface TreeItemData {
  id: string
  label: string
  children?: TreeItemData[]
}

/**
 * TableAsJson Component
 *
 * Displays JSON data in an interactive tree view using MUI X Tree View
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
   * Recursively render tree items
   */
  const renderTreeItems = (items: TreeItemData[]): JSX.Element[] =>
    items.map(item => (
      <TreeItem key={item.id} itemId={item.id} label={item.label}>
        {item.children && renderTreeItems(item.children)}
      </TreeItem>
    ))

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
    <Box className={styles['table-as-json']}>
      {/* Optional title above the card */}
      {hasTitle && (
        <Typography variant="subtitle2" className={styles['table-as-json__title']}>
          {title}
        </Typography>
      )}

      {/* Tree View Card with Copy Button inside */}
      <Paper className={styles['table-as-json__tree-container']} variant="outlined">
        {/* Copy button in top right corner */}
        {showCopyButton && (
          <Tooltip title="Copy JSON to clipboard">
            <IconButton onClick={handleCopyJson} size="small" className={styles['table-as-json__copy-button']}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <SimpleTreeView
          aria-label="JSON tree view"
          defaultExpandedItems={defaultExpandedIds}
          slots={{
            expandIcon: ExpandIcon,
            collapseIcon: CollapseIcon,
            endIcon: EndIcon,
          }}
          className={`${styles['table-as-json__tree-view']} ${showCopyButton ? styles['table-as-json__tree-view--with-copy-button'] : ''}`}
        >
          {renderTreeItems(treeItems)}
        </SimpleTreeView>
      </Paper>
    </Box>
  )
}

export default TableAsJson
