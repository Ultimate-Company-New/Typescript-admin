import React, { useEffect, useState } from "react";

import { format } from "date-fns";

import { Avatar, Box, Chip, Divider, Grid, Paper } from "@mui/material";

import { pickupLocationApi } from "../../../api/pickupLocationApi";
import { BodyText, FieldLabel, SecondaryFont, Subheader } from "../../../components/fonts";
import {
  PRODUCT_COLOR_OPTIONS,
  TIMEZONE_OPTIONS,
  getConditionColor,
  getConditionLabel,
} from "../../../constants/appConstants";
import styles from "../../../styles/Products.module.scss";
import type { ProductFormData } from "../../../utils/validationSchemas";
import PickupLocationCard, { type PickupLocationCardData } from "./PickupLocationCard";

interface ProductDetailsViewProps {
  watchedValues: ProductFormData;
}

interface PickupLocationApiData {
  pickupLocationId?: number;
  addressNickName?: string;
  address?: {
    nameOnAddress?: string;
    streetAddress?: string;
    streetAddress2?: string;
    streetAddress3?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phoneOnAddress?: string;
    emailOnAddress?: string;
  };
}

/**
 * Product Details View Component
 * Read-only display of product information with proper section formatting
 */
const ProductDetailsView = ({
  watchedValues,
}: ProductDetailsViewProps): React.JSX.Element => {
  // State to store full location data with quantities
  const [pickupLocations, setPickupLocations] = useState<PickupLocationCardData[]>([]);

  // Fetch full location data when pickupLocationQuantities changes
  useEffect(() => {
    const fetchLocationData = async (): Promise<void> => {
      const quantities = watchedValues.pickupLocationQuantities || {};
      const locationIds = Object.keys(quantities).map(Number);
      if (locationIds.length === 0) {
        setPickupLocations([]);
        return;
      }

      try {
        const response = await pickupLocationApi.getPickupLocationsInBatches({
          start: 0,
          end: 100,
          pageSize: 100,
        });

        const allLocations = (response.data || []) as PickupLocationApiData[];

        // Create location cards with quantity data
        const locationCards: PickupLocationCardData[] = locationIds
          .map(id => {
            const locationData = allLocations.find(loc => loc.pickupLocationId === id);
            if (locationData) {
              return {
                pickupLocation: {
                  pickupLocationId: id,
                  addressNickName: locationData.addressNickName,
                  address: locationData.address,
                },
                availableStock: quantities[id],
              };
            }
            // Fallback if location not found
            return {
              pickupLocation: {
                pickupLocationId: id,
                addressNickName: `Location ${id}`,
              },
              availableStock: quantities[id],
            };
          });

        setPickupLocations(locationCards);
      } catch {
        // Fallback to basic location data if fetch fails
        const fallbackCards: PickupLocationCardData[] = locationIds.map(id => ({
          pickupLocation: {
            pickupLocationId: id,
            addressNickName: `Location ${id}`,
          },
          availableStock: quantities[id],
        }));
        setPickupLocations(fallbackCards);
      }
    };

    void fetchLocationData();
  }, [watchedValues.pickupLocationQuantities]);

  /**
   * Format currency value
   */
  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);
  };

  /**
   * Format discount display based on type
   */
  const formatDiscount = (): string => {
    const value = watchedValues.discount;
    if (value === undefined || value === null) return "—";

    if (watchedValues.isDiscountPercent) {
      return `${value}%`;
    }
    return formatCurrency(value);
  };

  /**
   * Format item available from date with timezone
   */
  const formatAvailableFrom = (): string => {
    const itemAvailableFrom = watchedValues.itemAvailableFrom;
    if (!itemAvailableFrom?.dateTime) return "—";

    try {
      const formattedDate = format(new Date(itemAvailableFrom.dateTime), "do MMM yyyy, HH:mm");
      const timezone = itemAvailableFrom.timezone;

      // Get short timezone name
      const getShortTimezone = (tz: string): string => {
        const timezoneOption = TIMEZONE_OPTIONS.find(opt => opt.value === tz);
        if (timezoneOption) {
          // Extract short code from label like "IST (India Standard Time)" -> "IST"
          const match = timezoneOption.label.match(/^([A-Z]+)\s/);
          return match ? match[1] : tz;
        }
        return tz;
      };

      return timezone ? `${formattedDate} (${getShortTimezone(timezone)})` : formattedDate;
    } catch {
      return "—";
    }
  };

  /**
   * Get full timezone label
   */
  const getFullTimezoneLabel = (): string => {
    const timezone = watchedValues.itemAvailableFrom?.timezone;
    if (!timezone) return "";
    const option = TIMEZONE_OPTIONS.find(opt => opt.value === timezone);
    return option?.label ?? timezone;
  };

  return (
    <>
      {/* Product Images Section */}
      <Paper className={styles["products-page__section"]}>
        <Subheader
          label="Product Images"
          className={styles["products-page__section-title"]}
        />
        <Divider className={styles["products-page__divider"]} />
        <Box className={styles["products-page__divider-spacer"]} />

        <Grid container spacing={2}>
          {/* Main Image */}
          <Grid item xs={12} sm={4}>
            <Box className={styles["product-details-view__image-container"]}>
              <FieldLabel>Main Image</FieldLabel>
              <Avatar
                variant="square"
                src={watchedValues.mainImage}
                className={styles["product-details-view__image--main"]}
                sx={{ width: '100%', height: 180, borderRadius: 2 }}
              >
                M
              </Avatar>
            </Box>
          </Grid>

          {/* Other Required Images */}
          {[
            { label: "Top", image: watchedValues.topImage },
            { label: "Bottom", image: watchedValues.bottomImage },
            { label: "Front", image: watchedValues.frontImage },
            { label: "Back", image: watchedValues.backImage },
            { label: "Right", image: watchedValues.rightImage },
            { label: "Left", image: watchedValues.leftImage },
            { label: "Details", image: watchedValues.detailsImage },
          ].map(({ label, image }) => (
            <Grid item xs={12} sm={4} key={label}>
              <Box className={styles["product-details-view__image-container"]}>
                <FieldLabel>{label}</FieldLabel>
                <Avatar
                  variant="square"
                  src={image}
                  className={styles["product-details-view__image"]}
                  sx={{ width: '100%', height: 180, borderRadius: 2 }}
                >
                  {label[0]}
                </Avatar>
              </Box>
            </Grid>
          ))}

          {/* Optional Images */}
          {watchedValues.defectImage && (
            <Grid item xs={12} sm={4}>
              <Box className={styles["product-details-view__image-container"]}>
                <FieldLabel color="error.main">Defect</FieldLabel>
                <Avatar
                  variant="square"
                  src={watchedValues.defectImage}
                  className={styles["product-details-view__image--defect"]}
                  sx={{ width: '100%', height: 180, borderRadius: 2 }}
                >
                  D
                </Avatar>
              </Box>
            </Grid>
          )}
          {watchedValues.additionalImage1 && (
            <Grid item xs={12} sm={4}>
              <Box className={styles["product-details-view__image-container"]}>
                <FieldLabel>Additional 1</FieldLabel>
                <Avatar
                  variant="square"
                  src={watchedValues.additionalImage1}
                  className={styles["product-details-view__image"]}
                  sx={{ width: '100%', height: 180, borderRadius: 2 }}
                >
                  A1
                </Avatar>
              </Box>
            </Grid>
          )}
          {watchedValues.additionalImage2 && (
            <Grid item xs={12} sm={4}>
              <Box className={styles["product-details-view__image-container"]}>
                <FieldLabel>Additional 2</FieldLabel>
                <Avatar
                  variant="square"
                  src={watchedValues.additionalImage2}
                  className={styles["product-details-view__image"]}
                  sx={{ width: '100%', height: 180, borderRadius: 2 }}
                >
                  A2
                </Avatar>
              </Box>
            </Grid>
          )}
          {watchedValues.additionalImage3 && (
            <Grid item xs={12} sm={4}>
              <Box className={styles["product-details-view__image-container"]}>
                <FieldLabel>Additional 3</FieldLabel>
                <Avatar
                  variant="square"
                  src={watchedValues.additionalImage3}
                  className={styles["product-details-view__image"]}
                  sx={{ width: '100%', height: 180, borderRadius: 2 }}
                >
                  A3
                </Avatar>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Basic Information Section */}
      <Paper className={styles["products-page__section"]}>
        <Subheader
          label="Basic Information"
          className={styles["products-page__section-title"]}
        />
        <Divider className={styles["products-page__divider"]} />
        <Box className={styles["products-page__divider-spacer"]} />

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Title</FieldLabel>
              <BodyText variant="body1" className={styles["product-details-view__value--large"]}>
                {watchedValues.title || "—"}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Description</FieldLabel>
              <Box className={styles["product-details-view__html-content"]}>
                <Box
                  className={styles["rich-text-content"]}
                  dangerouslySetInnerHTML={{
                    __html: watchedValues.descriptionHtml || "<p>—</p>",
                  }}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Brand</FieldLabel>
              <BodyText>{watchedValues.brand || "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Model</FieldLabel>
              <BodyText>{watchedValues.model || "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Condition</FieldLabel>
              {watchedValues.condition ? (
                <Chip
                  label={getConditionLabel(watchedValues.condition)}
                  color={getConditionColor(watchedValues.condition)}
                  size="small"
                />
              ) : (
                <BodyText>—</BodyText>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>UPC</FieldLabel>
              <BodyText>{watchedValues.upc || "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Color</FieldLabel>
              <Box className={styles["product-details-view__color-display"]}>
                {watchedValues.color ? (
                  <>
                    <Box
                      className={styles["product-details-view__color-swatch"]}
                      style={{ backgroundColor: watchedValues.color }}
                    />
                    <Box>
                      <BodyText className={styles["product-details-view__color-name"]}>
                        {watchedValues.colorLabel || PRODUCT_COLOR_OPTIONS.find(opt => opt.hex === watchedValues.color)?.name || "Custom Color"}
                      </BodyText>
                      <SecondaryFont variant="caption">
                        {watchedValues.color}
                      </SecondaryFont>
                    </Box>
                  </>
                ) : (
                  <BodyText>—</BodyText>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Country of Manufacture</FieldLabel>
              <BodyText>{watchedValues.countryOfManufacture || "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Category</FieldLabel>
              <BodyText>{watchedValues.categoryFullPath || "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Item Modified</FieldLabel>
              <Chip
                label={watchedValues.itemModified ? "Yes" : "No"}
                color={watchedValues.itemModified ? "warning" : "default"}
                size="small"
              />
            </Box>
          </Grid>

          {watchedValues.itemModified && watchedValues.modificationHtml && (
            <Grid item xs={12}>
              <Box className={styles["product-details-view__field"]}>
                <FieldLabel>Modification Details</FieldLabel>
                <Box className={styles["product-details-view__html-content"]}>
                  <Box
                    className={styles["rich-text-content"]}
                    dangerouslySetInnerHTML={{
                      __html: watchedValues.modificationHtml,
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Pricing & Stock Section */}
      <Paper className={styles["products-page__section"]}>
        <Subheader
          label="Pricing & Stock"
          className={styles["products-page__section-title"]}
        />
        <Divider className={styles["products-page__divider"]} />
        <Box className={styles["products-page__divider-spacer"]} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Price</FieldLabel>
              <BodyText variant="body1" className={styles["product-details-view__price"]}>
                {formatCurrency(watchedValues.price)}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Discount</FieldLabel>
              <BodyText variant="body1" className={styles["product-details-view__discount"]}>
                {formatDiscount()}
              </BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Returns Allowed</FieldLabel>
              <Chip
                label={watchedValues.returnsAllowed ? "Yes" : "No"}
                color={watchedValues.returnsAllowed ? "success" : "default"}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Discount Type</FieldLabel>
              <Chip
                label={watchedValues.isDiscountPercent ? "Percentage" : "Fixed Amount"}
                color={watchedValues.isDiscountPercent ? "info" : "default"}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Available From</FieldLabel>
              <BodyText variant="body1" className={styles["product-details-view__value--large"]}>
                {formatAvailableFrom()}
              </BodyText>
              {watchedValues.itemAvailableFrom?.timezone && (
                <SecondaryFont variant="caption" className={styles["product-details-view__timezone"]}>
                  {getFullTimezoneLabel()}
                </SecondaryFont>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Dimensions & Weight Section */}
      <Paper className={styles["products-page__section"]}>
        <Subheader
          label="Dimensions & Weight"
          className={styles["products-page__section-title"]}
        />
        <Divider className={styles["products-page__divider"]} />
        <Box className={styles["products-page__divider-spacer"]} />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Length (cm)</FieldLabel>
              <BodyText>{watchedValues.length ?? "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Breadth (cm)</FieldLabel>
              <BodyText>{watchedValues.breadth ?? "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Height (cm)</FieldLabel>
              <BodyText>{watchedValues.height ?? "—"}</BodyText>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box className={styles["product-details-view__field"]}>
              <FieldLabel>Weight (kg)</FieldLabel>
              <BodyText>{watchedValues.weightKgs ?? "—"}</BodyText>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Pickup Locations & Stock Section */}
      {pickupLocations.length > 0 && (
        <Paper className={styles["products-page__section"]}>
          <Subheader
            label="Stock & Pickup Locations"
            className={styles["products-page__section-title"]}
          />
          <Divider className={styles["products-page__divider"]} />
          <Box className={styles["products-page__divider-spacer"]} />

          <Grid container spacing={2}>
            {pickupLocations.map((location, index) => (
              <Grid item xs={12} sm={6} key={location.pickupLocation?.pickupLocationId ?? index}>
                <PickupLocationCard location={location} index={index} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Notes Section */}
      <Paper className={styles["products-page__section"]}>
        <Subheader
          label="Notes"
          className={styles["products-page__section-title"]}
        />
        <Divider className={styles["products-page__divider"]} />
        <Box className={styles["products-page__divider-spacer"]} />
        <FieldLabel>Additional Notes</FieldLabel>
        <Box className={styles["product-details-view__notes-container"]}>
          <BodyText className={styles["product-details-view__notes"]}>
            {watchedValues.notes || "No notes provided"}
          </BodyText>
        </Box>
      </Paper>
    </>
  );
};

export default ProductDetailsView;
