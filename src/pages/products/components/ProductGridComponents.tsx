import { Link } from "@mui/material";

import { PERMISSIONS } from "../../../constants/appConstants";
import { APP_ROUTES } from "../../../constants/routes";
import { usePermissions } from "../../../hooks/usePermissions";
import styles from "../../../styles/Products.module.scss";

/**
 * Product Actions Cell Component
 * Renders action links (View, Edit, Deactivate, Activate) with permission-based visibility
 * Similar to UserActionsCell but for products
 */
export const ProductActionsCell = ({
  productId,
  isDeleted,
  onToggleProduct,
}: {
  productId: number;
  isDeleted: boolean;
  onToggleProduct?: (productId: number) => void;
}): JSX.Element => {
  const { hasPermission } = usePermissions();

  // Check permissions using PERMISSIONS constants for consistency
  const canViewProduct = hasPermission(PERMISSIONS.VIEW_PRODUCTS);
  const canUpdateProduct = hasPermission(PERMISSIONS.UPDATE_PRODUCTS);
  const canDeleteProduct = hasPermission(PERMISSIONS.DELETE_PRODUCTS);

  if (isDeleted) {
    // Only show Activate if user has delete permission
    if (!canDeleteProduct) {
      return <span className={styles["product-grid__empty-cell"]}>—</span>;
    }

    return (
      <div>
        <Link
          data-test-id="product-action-activate"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (onToggleProduct) {
              onToggleProduct(productId);
            }
          }}
          className={`${styles["product-grid__action-link"]} ${styles["product-grid__action-link--activate"]}`}
        >
          Activate
        </Link>
      </div>
    );
  }

  // Build actions based on permissions
  const actions: JSX.Element[] = [];

  if (canViewProduct) {
    actions.push(
      <Link
        key="view"
        data-test-id="product-action-view"
        href={`${APP_ROUTES.DASHBOARD.ADD_PRODUCT}?productId=${productId}&isView`}
        className={styles["product-grid__action-link"]}
      >
        View
      </Link>
    );
  }

  if (canUpdateProduct) {
    actions.push(
      <Link
        key="edit"
        data-test-id="product-action-edit"
        href={`${APP_ROUTES.DASHBOARD.ADD_PRODUCT}?productId=${productId}`}
        className={styles["product-grid__action-link"]}
      >
        Edit
      </Link>
    );
  }

  if (canDeleteProduct) {
    actions.push(
      <Link
        key="deactivate"
        data-test-id="product-action-toggle"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onToggleProduct) {
            onToggleProduct(productId);
          }
        }}
        className={`${styles["product-grid__action-link"]} ${styles["product-grid__action-link--deactivate"]}`}
      >
        Deactivate
      </Link>
    );
  }

  // If no permissions, show empty cell
  if (actions.length === 0) {
    return <span className={styles["product-grid__empty-cell"]}>—</span>;
  }

  return <div className={styles["product-grid__actions-container"]}>{actions}</div>;
};
