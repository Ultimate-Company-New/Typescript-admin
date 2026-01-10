import { Box, Grid, InputAdornment, Paper } from "@mui/material";

import { BodyText, SecondaryFont, Subheader } from "../../../components/fonts";
import { TextFieldInput } from "../../../components/form-input";
import styles from "../../../styles/PurchaseOrders.module.scss";

/**
 * Props for GrandTotalSummary component
 *
 * @property {Object} grandTotals - Aggregated totals across all products in the order
 *   @property {number} grossSubtotal - Total before any discounts (quantity × original price)
 *   @property {number} subtotal - Total after discounts but before packaging/shipping/tax
 *   @property {number} discount - Total discount amount applied across all products
 *   @property {number} packaging - Total packaging fees (deprecated, use totalPackagingCost instead)
 *   @property {number} shipping - Total shipping fees (deprecated, use totalShippingCost instead)
 *   @property {number} total - Grand total including all fees (deprecated, calculated here)
 * @property {number} totalPackagingCost - Total packaging cost from shipping optimization result.
 *   This comes from the optimization API and represents the actual packaging solution cost.
 * @property {number} totalShippingCost - Total shipping cost from selected couriers.
 *   Sum of all selected courier rates across all pickup locations.
 * @property {boolean} shippingCalculated - Whether shipping has been calculated via optimization.
 *   When false, shows "Calculate shipping" placeholder text instead of costs.
 * @property {number} serviceFee - Service fee amount (user input, defaults to 0).
 * @property {function} onServiceFeeChange - Callback to update service fee when user changes it.
 * @property {boolean} isView - Whether the component is in view-only mode.
 * @property {boolean} disabled - Whether the component is disabled.
 */
interface GrandTotalSummaryProps {
  grandTotals: {
    grossSubtotal: number;
    subtotal: number;
    discount: number;
    packaging: number;
    shipping: number;
    total: number;
  };
  totalPackagingCost: number;
  totalShippingCost: number;
  shippingCalculated: boolean;
  hasShippingData?: boolean; // Whether shipping allocations actually exist
  serviceFee?: number;
  onServiceFeeChange?: (serviceFee: number) => void;
  isView?: boolean;
  disabled?: boolean;
}

/**
 * Grand Total Summary Component
 *
 * Displays a comprehensive order summary showing all financial breakdowns:
 * - Products subtotal (before discount)
 * - Total discount (if any)
 * - Packaging fee (from optimization result)
 * - Shipping cost (from selected couriers)
 * - Subtotal before GST (products + packaging + shipping)
 * - GST amount (18% of subtotal)
 * - Grand total (subtotal + GST)
 *
 * This component provides a clear financial overview of the entire purchase order,
 * helping users understand the cost breakdown before finalizing the order.
 *
 * Calculation flow:
 * 1. Products Subtotal = sum of (quantity × pricePerUnit) before discount
 * 2. Discount = sum of all product discounts
 * 3. Subtotal Before GST = (Products after discount) + Packaging + Shipping + Service Fee
 * 4. GST = Subtotal Before GST × 18%
 * 5. Grand Total = Subtotal Before GST + GST
 *
 * @param {GrandTotalSummaryProps} props - Component props
 * @returns {JSX.Element} Rendered order summary paper
 */
const GrandTotalSummary = ({
  grandTotals,
  totalPackagingCost,
  totalShippingCost,
  shippingCalculated,
  hasShippingData = false,
  serviceFee = 0,
  onServiceFeeChange,
  isView = false,
  disabled = false,
}: GrandTotalSummaryProps): JSX.Element => {
  // Show numbers if:
  // 1. Shipping has been calculated AND there's actual shipping data, OR
  // 2. We have packaging or shipping costs (from orderSummary in view/edit mode, or from calculation)
  // Note: Removed isView restriction - edit mode also needs to display saved values
  const shouldShowShippingNumbers =
    (shippingCalculated && hasShippingData) ||
    totalPackagingCost > 0 ||
    totalShippingCost > 0;
  return (
    <Paper
      className={styles["product-items-section__grand-total-paper"]}
      sx={
        isView
          ? { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }
          : undefined
      }
    >
      <Subheader
        variant="subtitle1"
        label="🧾 Order Summary"
        className={styles["product-items-section__grand-total-header"]}
      />
      <Grid
        container
        spacing={1}
        sx={{
          padding: "16px",
          paddingTop: "0",
          "& .MuiGrid-item": { paddingTop: "10px !important" },
        }}
      >
        {/* Products Subtotal - Show grossSubtotal (before discount) so the discount line makes visual sense */}
        {/* When discount is shown as a separate line, users expect: Products - Discount = Net */}
        <Grid
          item
          xs={12}
          className={styles["product-items-section__grand-total-row"]}
        >
          <Grid container spacing={0}>
            <Grid
              item
              xs={12}
              sm={8}
              className={
                styles["product-items-section__grand-total-label-grid"]
              }
            >
              <BodyText
                variant="body2"
                className={styles["product-items-section__grand-total-label"]}
              >
                🛒 Products Subtotal
              </BodyText>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              className={
                styles["product-items-section__grand-total-value-grid"]
              }
            >
              <BodyText
                variant="body2"
                className={`${styles["product-items-section__grand-total-value"]} ${styles["product-items-section__grand-total-value--blue"]}`}
              >
                ₹
                {grandTotals.grossSubtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </BodyText>
            </Grid>
          </Grid>
        </Grid>

        {/* Discount - only show when there's a discount */}
        {grandTotals.discount > 0 && (
          <Grid
            item
            xs={12}
            className={styles["product-items-section__grand-total-row"]}
          >
            <Grid container spacing={0}>
              <Grid
                item
                xs={12}
                sm={8}
                className={
                  styles["product-items-section__grand-total-label-grid"]
                }
              >
                <BodyText
                  variant="body2"
                  className={`${styles["product-items-section__grand-total-label"]} ${styles["product-items-section__grand-total-label--red"]}`}
                >
                  🏷️ Total Discount
                </BodyText>
              </Grid>
              <Grid
                item
                xs={12}
                sm={4}
                className={
                  styles["product-items-section__grand-total-value-grid"]
                }
              >
                <BodyText
                  variant="body2"
                  className={`${styles["product-items-section__grand-total-value"]} ${styles["product-items-section__grand-total-value--red"]}`}
                >
                  -₹
                  {grandTotals.discount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* Packaging Fee - from optimization result */}
        <Grid
          item
          xs={12}
          className={styles["product-items-section__grand-total-row"]}
        >
          <Grid container spacing={0}>
            <Grid
              item
              xs={12}
              sm={8}
              className={
                styles["product-items-section__grand-total-label-grid"]
              }
            >
              <BodyText
                variant="body2"
                className={styles["product-items-section__grand-total-label"]}
              >
                📦 Packaging Fee
              </BodyText>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              className={
                styles["product-items-section__grand-total-value-grid"]
              }
            >
              {shouldShowShippingNumbers ? (
                <BodyText
                  variant="body2"
                  className={styles["product-items-section__grand-total-value"]}
                >
                  ₹
                  {totalPackagingCost.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              ) : (
                <SecondaryFont
                  variant="caption"
                  className={
                    styles["product-items-section__grand-total-helper-text"]
                  }
                >
                  Click on "Calculate Shipping" to calculate cost
                </SecondaryFont>
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* Shipping */}
        <Grid
          item
          xs={12}
          className={styles["product-items-section__grand-total-row"]}
        >
          <Grid container spacing={0}>
            <Grid
              item
              xs={12}
              sm={8}
              className={
                styles["product-items-section__grand-total-label-grid"]
              }
            >
              <BodyText
                variant="body2"
                className={styles["product-items-section__grand-total-label"]}
              >
                🚚 Total Shipping
              </BodyText>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              className={
                styles["product-items-section__grand-total-value-grid"]
              }
            >
              {shouldShowShippingNumbers ? (
                <BodyText
                  variant="body2"
                  className={styles["product-items-section__grand-total-value"]}
                >
                  ₹
                  {totalShippingCost.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              ) : (
                <SecondaryFont
                  variant="caption"
                  className={
                    styles["product-items-section__grand-total-helper-text"]
                  }
                >
                  Click on "Calculate Shipping" to calculate cost
                </SecondaryFont>
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* Service Fee - Editable input */}
        <Grid
          item
          xs={12}
          className={styles["product-items-section__grand-total-row"]}
        >
          <Grid container spacing={0}>
            <Grid
              item
              xs={12}
              sm={8}
              className={
                styles["product-items-section__grand-total-label-grid"]
              }
            >
              <BodyText
                variant="body2"
                className={styles["product-items-section__grand-total-label"]}
              >
                💼 Service Fee
              </BodyText>
            </Grid>
            <Grid
              item
              xs={12}
              sm={4}
              className={styles["product-items-section__service-fee-grid"]}
            >
              {isView || !onServiceFeeChange ? (
                <BodyText
                  variant="body2"
                  className={styles["product-items-section__grand-total-value"]}
                >
                  ₹
                  {serviceFee.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </BodyText>
              ) : (
                <TextFieldInput
                  type="number"
                  formatNumber={false}
                  value={serviceFee}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    onServiceFeeChange(value);
                  }}
                  disabled={disabled}
                  size="small"
                  margin="none"
                  inputProps={{
                    min: 0,
                    step: 0.01,
                    className:
                      styles["product-items-section__service-fee-input-field"],
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment
                        position="start"
                        className={
                          styles["product-items-section__service-fee-adornment"]
                        }
                      >
                        <Box
                          className={
                            styles[
                              "product-items-section__service-fee-rupee-box"
                            ]
                          }
                        >
                          ₹
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                  className={styles["product-items-section__service-fee-input"]}
                  placeholder="0.00"
                />
              )}
            </Grid>
          </Grid>
        </Grid>

        {/*
          Subtotal before GST calculation:
          This IIFE (Immediately Invoked Function Expression) calculates the final totals
          including GST. We use an IIFE here to keep the calculation logic scoped and
          avoid polluting the component's scope with temporary variables.

          Formula:
          - Subtotal Before GST = Products (after discount) + Packaging + Shipping + Service Fee
          - GST = 18% of Subtotal Before GST (standard Indian GST rate)
          - Grand Total = Subtotal Before GST + GST
        */}
        {(() => {
          // Calculate subtotal before GST: products (already discounted) + packaging + shipping + service fee
          // Only include packaging and shipping costs if there's actual shipping data
          const packagingCost = shouldShowShippingNumbers
            ? totalPackagingCost
            : 0;
          const shippingCost = shouldShowShippingNumbers
            ? totalShippingCost
            : 0;
          const subtotalBeforeGst =
            grandTotals.subtotal + packagingCost + shippingCost + serviceFee;
          // Calculate GST: 18% of subtotal (standard Indian tax rate)
          const gstAmount = subtotalBeforeGst * 0.18;
          // Grand total: subtotal + GST
          const grandTotal = subtotalBeforeGst + gstAmount;

          return (
            <>
              <Grid
                item
                xs={12}
                className={styles["product-items-section__grand-total-row"]}
              >
                <Grid container spacing={0}>
                  <Grid
                    item
                    xs={12}
                    sm={8}
                    className={
                      styles["product-items-section__grand-total-label-grid"]
                    }
                  >
                    <BodyText
                      variant="body2"
                      className={`${styles["product-items-section__grand-total-label"]} ${styles["product-items-section__grand-total-value-bold--orange"]}`}
                    >
                      💰 Subtotal
                    </BodyText>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    className={
                      styles["product-items-section__grand-total-value-grid"]
                    }
                  >
                    <BodyText
                      variant="body2"
                      className={`${styles["product-items-section__grand-total-value-bold"]} ${styles["product-items-section__grand-total-value-bold--orange"]}`}
                    >
                      ₹
                      {subtotalBeforeGst.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </BodyText>
                  </Grid>
                </Grid>
              </Grid>

              {/* Tax calculation - 18% GST on subtotal */}
              <Grid
                item
                xs={12}
                className={styles["product-items-section__grand-total-row"]}
              >
                <Grid container spacing={0}>
                  <Grid
                    item
                    xs={12}
                    sm={8}
                    className={
                      styles["product-items-section__grand-total-label-grid"]
                    }
                  >
                    <BodyText
                      variant="body2"
                      className={
                        styles["product-items-section__grand-total-label"]
                      }
                    >
                      📊 GST (18%)
                    </BodyText>
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    className={
                      styles["product-items-section__grand-total-value-grid"]
                    }
                  >
                    <BodyText
                      variant="body2"
                      className={
                        styles["product-items-section__grand-total-value"]
                      }
                    >
                      ₹
                      {gstAmount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </BodyText>
                  </Grid>
                </Grid>
              </Grid>

              {/* Grand Total = subtotal + GST */}
              <Grid
                item
                xs={12}
                className={styles["product-items-section__grand-total-row"]}
              >
                <Grid container spacing={0}>
                  <Grid
                    item
                    xs={12}
                    sm={8}
                    className={
                      styles["product-items-section__grand-total-label-grid"]
                    }
                  >
                    <Subheader
                      variant="h6"
                      label="✨ Grand Total"
                      className={
                        styles["product-items-section__grand-total-final-label"]
                      }
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={4}
                    className={
                      styles["product-items-section__grand-total-value-grid"]
                    }
                  >
                    <Subheader
                      variant="h5"
                      label={`₹${grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}`}
                      className={`${styles["product-items-section__grand-total-final-value"]} ${styles["product-items-section__grand-total-final-value--green"]}`}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </>
          );
        })()}
      </Grid>
    </Paper>
  );
};

export default GrandTotalSummary;
