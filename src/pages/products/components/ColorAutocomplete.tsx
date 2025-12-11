import type React from "react";

import { Autocomplete, Box, InputAdornment, TextField } from "@mui/material";

import { PRODUCT_COLOR_OPTIONS } from "../../../constants/appConstants";
import formStyles from "../../../styles/FormInput.module.scss";
import styles from "../../../styles/Products.module.scss";

interface ColorOption {
  value: string;
  label: string;
  hex: string;
  name: string;
}

interface ColorAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Color Autocomplete Component
 * Custom autocomplete for selecting product colors with visual color squares
 * Features:
 * - Visual color square in input field
 * - Color squares in dropdown options
 * - Search by hex code or color name
 * - 872 predefined colors
 */
const ColorAutocomplete: React.FC<ColorAutocompleteProps> = ({
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
  required = false,
}) => {
  // Convert color options to the format with all needed properties
  const colorOptions: ColorOption[] = PRODUCT_COLOR_OPTIONS.map((opt) => ({
    value: opt.hex,
    label: `${opt.hex} - ${opt.name}`,
    hex: opt.hex,
    name: opt.name,
  }));

  // Find the currently selected color option
  const selectedColor = colorOptions.find((opt) => opt.value === value) || null;

  return (
    <Autocomplete
      options={colorOptions}
      value={selectedColor}
      onChange={(_, newValue) => {
        onChange(newValue?.value || "");
      }}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.label
      }
      filterOptions={(options, { inputValue }) => {
        const searchTerm = inputValue.toLowerCase();
        return options.filter(
          (opt) =>
            opt.hex.toLowerCase().includes(searchTerm) ||
            opt.name.toLowerCase().includes(searchTerm)
        );
      }}
      disabled={disabled}
      fullWidth
      ListboxProps={{
        style: {
          maxHeight: "300px",
          padding: 0,
        },
      }}
      isOptionEqualToValue={(option, val) => option.value === val.value}
      renderOption={(props, option) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { key, ...otherProps } = props;
        return (
          <Box
            component="li"
            {...otherProps}
            key={option.value}
            className={styles["color-option"]}
          >
            <Box
              className={styles["color-square"]}
              sx={{ backgroundColor: option.hex }}
            />
            <Box className={styles["color-text-container"]}>
              <Box component="span" className={styles["color-hex"]}>
                {option.hex}
              </Box>
              <Box component="span" className={styles["color-name"]}>
                - {option.name}
              </Box>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Color"
          variant="filled"
          margin="normal"
          required={required}
          error={error}
          helperText={helperText}
          placeholder="Search by color name or hex code"
          className={formStyles["filled-input"]}
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            ...params.InputProps,
            disableUnderline: true,
            startAdornment: selectedColor ? (
              <>
                <InputAdornment
                  position="start"
                  className={styles["color-input-adornment"]}
                  sx={{ marginTop: '0 !important', alignSelf: 'center' }}
                >
                  <Box
                    className={styles["color-square-input"]}
                    sx={{ backgroundColor: selectedColor.hex }}
                  />
                </InputAdornment>
                {params.InputProps.startAdornment}
              </>
            ) : (
              params.InputProps.startAdornment
            ),
          }}
        />
      )}
    />
  );
};

export default ColorAutocomplete;
