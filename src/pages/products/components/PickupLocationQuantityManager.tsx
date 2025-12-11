import { useCallback, useEffect, useRef, useState } from "react";

import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import { SecondaryFont } from "../../../components/fonts";
import { debounce } from "@mui/material/utils";

import { pickupLocationApi } from "../../../api/pickupLocationApi";
import { TextFieldInput } from "../../../components/form-input";
import formInputStyles from "../../../styles/FormInput.module.scss";
import styles from "../../../styles/Products.module.scss";

interface PickupLocationOption {
  value: number;
  label: string;
}

interface PickupLocationQuantity {
  locationId: number;
  locationName: string;
  quantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

/**
 * Extended data structure for package pickup location mappings
 * Includes reorderLevel, maxStockLevel, and lastRestockDate for inventory management
 * Maps to PackagePickupLocationMapping table columns
 */
export interface PackageLocationData {
  quantity: number;
  reorderLevel: number;
  maxStockLevel: number;
  lastRestockDate?: string;
}

/**
 * Props for the PickupLocationQuantityManager component
 * @param variant - "product" for simple quantity only, "package" for extended fields
 * @param value - For "product": Record<locationId, quantity>. For "package": Record<locationId, PackageLocationData>
 * @param onChange - Callback when values change
 */
interface PickupLocationQuantityManagerProps {
  /** "product" shows only quantity, "package" shows quantity + reorder level + max stock */
  variant?: "product" | "package";
  value: Record<number, number> | Record<number, PackageLocationData>;
  onChange: (value: Record<number, number> | Record<number, PackageLocationData>) => void;
  disabled?: boolean;
}

interface PickupLocationData {
  pickupLocationId?: number;
  addressNickName?: string;
  deleted?: boolean;
}

/**
 * Helper to check if a value is PackageLocationData
 */
const isPackageLocationData = (val: number | PackageLocationData): val is PackageLocationData => {
  return typeof val === "object" && "quantity" in val;
};

/**
 * Pickup Location Quantity Manager with Lazy Loading
 * Allows managing stock quantities for multiple pickup locations
 * Uses autocomplete with server-side search and pagination
 *
 * @param variant - "product" (default) shows only quantity column
 *                  "package" shows quantity, reorder level, and max stock level columns
 */
const PickupLocationQuantityManager = ({
  variant = "product",
  value,
  onChange,
  disabled = false,
}: PickupLocationQuantityManagerProps): JSX.Element => {
  const isPackageVariant = variant === "package";
  const [locations, setLocations] = useState<PickupLocationQuantity[]>([]);
  const [options, setOptions] = useState<PickupLocationOption[][]>([]);
  const [loading, setLoading] = useState<boolean[]>([]);
  const [inputValues, setInputValues] = useState<string[]>([]);
  const isInitialMount = useRef(true);
  const onChangeRef = useRef(onChange);
  const previousLocationIdsRef = useRef<string>("");
  const isInternalUpdate = useRef(false);

  // Keep onChange ref up to date
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize locations from value prop - only when location IDs change, not quantities
  useEffect(() => {
    // Skip if this update was triggered by our own onChange (internal update)
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const valueEntries = Object.entries(value || {});

    // Get new location IDs sorted for comparison
    const newLocationIds = valueEntries.map(([id]) => Number(id)).sort((a, b) => a - b);
    const serializedNewIds = JSON.stringify(newLocationIds);

    // Compare only the location IDs, not quantities
    const locationIdsChanged = serializedNewIds !== previousLocationIdsRef.current;

    // If location IDs haven't changed, skip the full reload
    if (!locationIdsChanged && previousLocationIdsRef.current !== "") {
      return;
    }

    // Don't reset if value is empty and we already have a previous state
    if (valueEntries.length === 0 && previousLocationIdsRef.current !== "") {
      return;
    }

    // Update the ref with new location IDs
    previousLocationIdsRef.current = serializedNewIds;

    // Full initialization - location IDs have changed or first load
    const initialLocations = valueEntries.map(
      ([locationId, val]) => {
        // Handle both product (number) and package (object) data structures
        if (isPackageLocationData(val as number | PackageLocationData)) {
          const packageData = val as PackageLocationData;
          return {
            locationId: Number(locationId),
            locationName: `Loading...`, // Temporary name while loading
            quantity: packageData.quantity,
            reorderLevel: packageData.reorderLevel,
            maxStockLevel: packageData.maxStockLevel,
          };
        }
        // Simple product variant - just quantity
        return {
          locationId: Number(locationId),
          locationName: `Loading...`, // Temporary name while loading
          quantity: Number(val),
          reorderLevel: 10, // Default
          maxStockLevel: 1000, // Default
        };
      }
    );

    // Create initial options for each location to prevent Autocomplete warnings
    const initialOptions = initialLocations.map((loc) =>
      loc.locationId > 0
        ? [{ value: loc.locationId, label: `Loading...` }]
        : []
    );

    setLocations(initialLocations);
    setOptions(initialOptions);
    setLoading(initialLocations.map(() => false));
    setInputValues(initialLocations.map(() => ""));

    // Reset initial mount flag to prevent immediate onChange trigger
    isInitialMount.current = true;

    // Load names for existing locations using batch API
    const loadAllLocationNames = async () => {
      const locationIds = initialLocations
        .filter((loc) => loc.locationId > 0)
        .map((loc) => loc.locationId);

      if (locationIds.length === 0) return;

      try {
        // Fetch locations using batch API (no permission issues)
        const response = await pickupLocationApi.getPickupLocationsInBatches({
          start: 0,
          end: 100,
          pageSize: 100,
        });

        const allLocations = (response.data || []) as PickupLocationData[];

        // Create a map of locationId to name for quick lookup
        const nameMap = new Map<number, string>();
        allLocations.forEach((loc) => {
          if (loc.pickupLocationId !== undefined) {
            nameMap.set(loc.pickupLocationId, loc.addressNickName || `Location ${loc.pickupLocationId}`);
          }
        });

        // Update locations and options with the names
        setLocations((prev) => {
          return prev.map((loc) => {
            if (loc.locationId > 0 && nameMap.has(loc.locationId)) {
              return { ...loc, locationName: nameMap.get(loc.locationId)! };
            }
            return { ...loc, locationName: `Location ${loc.locationId}` };
          });
        });

        setOptions((prev) => {
          return prev.map((opts, index) => {
            const loc = initialLocations[index];
            if (loc && loc.locationId > 0) {
              const name = nameMap.get(loc.locationId) || `Location ${loc.locationId}`;
              return [{ value: loc.locationId, label: name }];
            }
            return opts;
          });
        });
      } catch {
        // Fallback: set location names as "Location {id}"
        setLocations((prev) => {
          return prev.map((loc) => ({
            ...loc,
            locationName: loc.locationId > 0 ? `Location ${loc.locationId}` : '',
          }));
        });
        setOptions((prev) => {
          return prev.map((opts, index) => {
            const loc = initialLocations[index];
            if (loc && loc.locationId > 0) {
              return [{ value: loc.locationId, label: `Location ${loc.locationId}` }];
            }
            return opts;
          });
        });
      }
    };

    void loadAllLocationNames();
  }, [value]);

  // Update parent when locations change (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Build value based on variant
    if (isPackageVariant) {
      const newValue: Record<number, PackageLocationData> = {};
      locations.forEach((loc) => {
        if (loc.locationId > 0) {
          newValue[loc.locationId] = {
            quantity: loc.quantity >= 0 ? loc.quantity : 0,
            reorderLevel: loc.reorderLevel ?? 10,
            maxStockLevel: loc.maxStockLevel ?? 1000,
          };
        }
      });
      isInternalUpdate.current = true;
      onChangeRef.current(newValue);
      return;
    }

    // Product variant - simple quantity
    const newValue: Record<number, number> = {};
    locations.forEach((loc) => {
      // Include all locations with valid IDs, even if quantity is 0
      // This prevents rows from being removed when user clears the quantity field
      if (loc.locationId > 0) {
        newValue[loc.locationId] = loc.quantity >= 0 ? loc.quantity : 0;
      }
    });

    // Mark this as an internal update so the value change effect doesn't re-initialize
    isInternalUpdate.current = true;
    onChangeRef.current(newValue);
  }, [locations]);

  /**
   * Fetch pickup locations from API
   */
  const fetchPickupLocations = useCallback(
    async (searchText: string, index: number): Promise<void> => {
      setLoading((prev) => {
        const updated = [...prev];
        updated[index] = true;
        return updated;
      });

      try {
        const filters = searchText
          ? [
              {
                column: "addressNickName",
                operator: "contains",
                value: searchText,
              },
            ]
          : undefined;

        const response = await pickupLocationApi.getPickupLocationsInBatches({
          start: 0,
          end: 50,
          pageSize: 50,
          includeDeleted: false,
          filters,
        });

        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
        const data = (response.data as any[]) || [];
        const pickupOptions: PickupLocationOption[] = data.map((item: any) => ({
          value: item.pickupLocationId || item.pickupLocation?.pickupLocationId || 0,
          label: item.addressNickName || item.pickupLocation?.addressNickName || `Location ${item.pickupLocationId}`,
        }));
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */

        setOptions((prev) => {
          const updated = [...prev];
          updated[index] = pickupOptions;
          return updated;
        });
      } catch {
        // Failed to fetch pickup locations - set empty options
        setOptions((prev) => {
          const updated = [...prev];
          updated[index] = [];
          return updated;
        });
      } finally {
        setLoading((prev) => {
          const updated = [...prev];
          updated[index] = false;
          return updated;
        });
      }
    },
    []
  );

  // Create debounced fetch functions for each row
  const debouncedFetch = useCallback(
    (searchText: string, index: number) => {
      const debouncedFunc = debounce(() => {
        void fetchPickupLocations(searchText, index);
      }, 300);
      debouncedFunc();
    },
    [fetchPickupLocations]
  );

  const handleAddLocation = (): void => {
    const newLocation: PickupLocationQuantity = {
      locationId: 0,
      locationName: "",
      quantity: 0,
      reorderLevel: 10, // Default from SQL schema
      maxStockLevel: 1000, // Default from SQL schema
    };
    setLocations([...locations, newLocation]);
    setOptions([...options, []]);
    setLoading([...loading, false]);
    setInputValues([...inputValues, ""]);
  };

  const handleRemoveLocation = (index: number): void => {
    setLocations(locations.filter((_, i) => i !== index));
    setOptions(options.filter((_, i) => i !== index));
    setLoading(loading.filter((_, i) => i !== index));
    setInputValues(inputValues.filter((_, i) => i !== index));
  };

  const handleLocationChange = (
    index: number,
    newValue: PickupLocationOption | null
  ): void => {
    const newLocations = [...locations];
    if (newValue) {
      newLocations[index] = {
        ...newLocations[index],
        locationId: newValue.value,
        locationName: newValue.label,
      };
    } else {
      newLocations[index] = {
        ...newLocations[index],
        locationId: 0,
        locationName: "",
      };
    }
    setLocations(newLocations);
  };

  const handleQuantityChange = (index: number, quantity: number): void => {
    const newLocations = [...locations];
    newLocations[index].quantity = quantity;
    setLocations(newLocations);
  };

  const handleReorderLevelChange = (index: number, reorderLevel: number): void => {
    const newLocations = [...locations];
    newLocations[index].reorderLevel = reorderLevel;
    setLocations(newLocations);
  };

  const handleMaxStockLevelChange = (index: number, maxStockLevel: number): void => {
    const newLocations = [...locations];
    newLocations[index].maxStockLevel = maxStockLevel;
    setLocations(newLocations);
  };

  const handleInputChange = (index: number, newInputValue: string): void => {
    setInputValues((prev) => {
      const updated = [...prev];
      updated[index] = newInputValue;
      return updated;
    });

    // Fetch options when user types
    if (newInputValue) {
      debouncedFetch(newInputValue, index);
    }
  };

  return (
    <Box className={styles["pickup-location-manager"]}>
      {locations.length > 0 && (
        <TableContainer
          component={Paper}
          variant="outlined"
          className={styles["pickup-location-manager__table-container"]}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  width={isPackageVariant ? "30%" : "50%"}
                  className={styles["pickup-location-manager__table-cell"]}
                >
                  Pickup Location
                </TableCell>
                <TableCell
                  width={isPackageVariant ? "15%" : "30%"}
                  className={styles["pickup-location-manager__table-cell"]}
                >
                  Available Quantity
                </TableCell>
                {isPackageVariant && (
                  <>
                    <TableCell
                      width="15%"
                      className={styles["pickup-location-manager__table-cell"]}
                    >
                      Reorder Level
                    </TableCell>
                    <TableCell
                      width="15%"
                      className={styles["pickup-location-manager__table-cell"]}
                    >
                      Max Stock Level
                    </TableCell>
                  </>
                )}
                <TableCell
                  align="center"
                  width={isPackageVariant ? "10%" : "20%"}
                  className={styles["pickup-location-manager__table-cell"]}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((location, index) => {
                const currentValue = location.locationId > 0
                  ? { value: location.locationId, label: location.locationName }
                  : null;

                return (
                  <TableRow key={index}>
                    <TableCell className={styles["pickup-location-manager__table-cell"]}>
                      <Autocomplete
                        value={currentValue}
                        onChange={(_event, newValue) =>
                          handleLocationChange(index, newValue)
                        }
                        inputValue={inputValues[index] || ""}
                        onInputChange={(_event, newInputValue) =>
                          handleInputChange(index, newInputValue)
                        }
                        options={options[index] || []}
                        loading={loading[index]}
                        disabled={disabled}
                        fullWidth
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) =>
                          option.value === value.value
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="filled"
                            placeholder="Search pickup location..."
                            className={`${formInputStyles['filled-input']} ${styles["pickup-location-manager__autocomplete"]}`}
                            InputLabelProps={{
                              shrink: true,
                            }}
                            InputProps={{
                              ...params.InputProps,
                              disableUnderline: true,
                              endAdornment: (
                                <>
                                  {loading[index] ? (
                                    <CircularProgress color="inherit" size={20} />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        onOpen={() => {
                          if ((options[index] || []).length === 0) {
                            void fetchPickupLocations("", index);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className={styles["pickup-location-manager__table-cell"]}>
                      <TextFieldInput
                        type="number"
                        value={location.quantity === 0 ? "" : location.quantity}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow empty string (treat as 0) or parse the number
                          const quantity = val === "" ? 0 : parseInt(val, 10);
                          handleQuantityChange(index, isNaN(quantity) ? 0 : quantity);
                        }}
                        disabled={disabled}
                        margin="none"
                        placeholder="0"
                        inputProps={{ min: 0 }}
                        className={styles["pickup-location-manager__quantity-input"]}
                      />
                    </TableCell>
                    {isPackageVariant && (
                      <>
                        <TableCell className={styles["pickup-location-manager__table-cell"]}>
                          <TextFieldInput
                            type="number"
                            value={location.reorderLevel === 0 ? "" : (location.reorderLevel ?? 10)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const reorderLevel = val === "" ? 0 : parseInt(val, 10);
                              handleReorderLevelChange(index, isNaN(reorderLevel) ? 0 : reorderLevel);
                            }}
                            disabled={disabled}
                            margin="none"
                            placeholder="10"
                            inputProps={{ min: 0 }}
                            className={styles["pickup-location-manager__quantity-input"]}
                          />
                        </TableCell>
                        <TableCell className={styles["pickup-location-manager__table-cell"]}>
                          <TextFieldInput
                            type="number"
                            value={location.maxStockLevel === 0 ? "" : (location.maxStockLevel ?? 1000)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const maxStockLevel = val === "" ? 0 : parseInt(val, 10);
                              handleMaxStockLevelChange(index, isNaN(maxStockLevel) ? 1 : Math.max(1, maxStockLevel));
                            }}
                            disabled={disabled}
                            margin="none"
                            placeholder="1000"
                            inputProps={{ min: 1 }}
                            className={styles["pickup-location-manager__quantity-input"]}
                          />
                        </TableCell>
                      </>
                    )}
                    <TableCell
                      align="center"
                      className={styles["pickup-location-manager__table-cell"]}
                    >
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveLocation(index)}
                        disabled={disabled}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!disabled && (
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddLocation}
          variant="outlined"
          size="small"
          className={styles["pickup-location-manager__add-button"]}
        >
          Add Pickup Location
        </Button>
      )}

      {locations.length === 0 && (
        <SecondaryFont className={styles["pickup-location-manager__empty-message"]}>
          No pickup locations added yet. Click &quot;Add Pickup Location&quot; to begin.
        </SecondaryFont>
      )}
    </Box>
  );
};

export default PickupLocationQuantityManager;
