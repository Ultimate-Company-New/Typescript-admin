import { useState } from "react";

import type { UseFormSetValue } from "react-hook-form";
import { toast } from "react-toastify";

import { Science as ScienceIcon } from "@mui/icons-material";
import { CircularProgress, Fab, Tooltip } from "@mui/material";

import styles from "../../../styles/Products.module.scss";
import { generateProductFormTest } from "../../../utils/generateTestData";
import type { ProductFormData } from "../../../utils/validationSchemas";

interface FillTestDataButtonProps {
  setValue: UseFormSetValue<ProductFormData>;
  onCategoryParentIdChange?: (parentId: number | null) => void;
}

/**
 * Fill Test Data Button for Product Forms
 * Generates and fills realistic test data for development/testing
 */
const FillTestDataButton = ({
  setValue,
  onCategoryParentIdChange,
}: FillTestDataButtonProps): JSX.Element => {
  const [filling, setFilling] = useState(false);

  const handleFillTestData = async (): Promise<void> => {
    setFilling(true);

    try {
      // Generate test data (async - fetches real pickup locations from database)
      const testData = await generateProductFormTest();

      // Fill form fields - Basic Information
      setValue("title", testData.title ?? "", { shouldValidate: true });
      setValue("descriptionHtml", testData.descriptionHtml ?? "", {
        shouldValidate: true,
      });
      setValue("brand", testData.brand ?? "", { shouldValidate: true });
      setValue("model", testData.model ?? "", { shouldValidate: true });
      setValue("condition", testData.condition ?? "", { shouldValidate: true });
      setValue("upc", testData.upc ?? "", { shouldValidate: true });
      setValue("color", testData.color ?? "", { shouldValidate: true });
      setValue("colorLabel", testData.colorLabel ?? "", {
        shouldValidate: true,
      });
      setValue("countryOfManufacture", testData.countryOfManufacture ?? "", {
        shouldValidate: true,
      });
      setValue("itemModified", testData.itemModified ?? false, {
        shouldValidate: true,
      });
      setValue("modificationHtml", testData.modificationHtml ?? "", {
        shouldValidate: true,
      });

      // Fill form fields - Pricing & Stock
      setValue("price", testData.price ?? 0, { shouldValidate: true });
      setValue("discount", testData.discount ?? 0, { shouldValidate: true });
      setValue("isDiscountPercent", testData.isDiscountPercent ?? false, {
        shouldValidate: true,
      });
      setValue("returnsAllowed", testData.returnsAllowed ?? false, {
        shouldValidate: true,
      });

      // Fill form fields - Dimensions & Weight
      setValue("length", testData.length, { shouldValidate: true });
      setValue("breadth", testData.breadth, { shouldValidate: true });
      setValue("height", testData.height, { shouldValidate: true });
      setValue("weightKgs", testData.weightKgs, { shouldValidate: true });

      // Fill form fields - Category
      setValue("categoryId", testData.categoryId ?? 1, {
        shouldValidate: true,
      });
      // Set the category full path for display (now part of form data)
      setValue("categoryFullPath", testData.categoryFullPath ?? "", {
        shouldValidate: false,
      });
      // Set the parent ID for navigation state
      if (onCategoryParentIdChange) {
        onCategoryParentIdChange(testData.categoryParentId ?? null);
      }

      // Fill form fields - Required Images
      setValue("mainImage", testData.mainImage ?? "", { shouldValidate: true });
      setValue("topImage", testData.topImage ?? "", { shouldValidate: true });
      setValue("bottomImage", testData.bottomImage ?? "", {
        shouldValidate: true,
      });
      setValue("frontImage", testData.frontImage ?? "", {
        shouldValidate: true,
      });
      setValue("backImage", testData.backImage ?? "", { shouldValidate: true });
      setValue("rightImage", testData.rightImage ?? "", {
        shouldValidate: true,
      });
      setValue("leftImage", testData.leftImage ?? "", { shouldValidate: true });
      setValue("detailsImage", testData.detailsImage ?? "", {
        shouldValidate: true,
      });

      // Fill form fields - Optional Images
      setValue("defectImage", testData.defectImage ?? "", {
        shouldValidate: true,
      });
      setValue("additionalImage1", testData.additionalImage1 ?? "", {
        shouldValidate: true,
      });
      setValue("additionalImage2", testData.additionalImage2 ?? "", {
        shouldValidate: true,
      });
      setValue("additionalImage3", testData.additionalImage3 ?? "", {
        shouldValidate: true,
      });

      // Fill form fields - Pickup Locations & Notes
      // pickupLocationQuantities contains real location IDs fetched from the database
      setValue(
        "pickupLocationQuantities",
        testData.pickupLocationQuantities ?? {},
        { shouldValidate: true }
      );
      setValue("notes", testData.notes ?? "", { shouldValidate: true });
      setValue("itemAvailableFrom", testData.itemAvailableFrom, {
        shouldValidate: true,
      });

      const locationCount = Object.keys(testData.pickupLocationQuantities ?? {}).length;
      toast.success(`Test data filled successfully! ${locationCount} pickup locations added.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate test data";
      toast.error(message);
    } finally {
      setFilling(false);
    }
  };

  return (
    <Tooltip title="Fill Test Data" placement="left">
      <Fab
        aria-label="fill test data"
        onClick={() => void handleFillTestData()}
        disabled={filling}
        className={styles["fill-test-data-button__fab"]}
      >
        {filling ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <ScienceIcon />
        )}
      </Fab>
    </Tooltip>
  );
};

export default FillTestDataButton;
