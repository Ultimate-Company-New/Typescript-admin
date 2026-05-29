import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  Grid,
  Alert,
  type SelectChangeEvent,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';

import { BlueButton, RedButton } from '../../../components/buttons';
import { Subheader } from '../../../components/fonts';
import shipmentApi, { type CreateReturnRequest, type ReturnProductItem } from '../../../api/shipmentApi';
import type { ShipmentData } from '../../../models/api-models/ShipmentModels';
import type { ProductResponseModel } from '../../../models/api-models';
import { RETURN_REASON_OPTIONS, type ReturnReason } from '../../../constants/appConstants';

interface ReturnProductSelection {
  productId: number;
  product: ProductResponseModel;
  selected: boolean;
  quantity: number;
  maxQuantity: number;
  reason: string;
  comments: string;
}

interface ReturnShipmentModalProps {
  open: boolean;
  onClose: () => void;
  shipment: ShipmentData | null;
  onSuccess?: () => void;
}

/**
 * Modal for creating return orders for a delivered shipment
 */
const ReturnShipmentModal: React.FC<ReturnShipmentModalProps> = ({
  open,
  onClose,
  shipment,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState({
    length: 11,
    breadth: 11,
    height: 11,
    weight: 0.5,
  });

  // Initialize returnable products - only products within their return window
  const initialProducts = useMemo((): ReturnProductSelection[] => {
    if (!shipment?.products) return [];

    // Get delivery date - fall back to expected if no actual delivery date
    const deliveryDateStr = shipment.deliveredDate || shipment.expectedDeliveryDate;
    if (!deliveryDateStr) return [];

    const deliveryDate = new Date(deliveryDateStr);
    const today = new Date();
    const daysSinceDelivery = Math.floor(
      (today.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return shipment.products
      .filter((p) => {
        const returnWindowDays = p.returnWindowDays ?? 0;
        // Product is returnable if it has a return window > 0 AND we're still within the window
        return returnWindowDays > 0 && daysSinceDelivery <= returnWindowDays;
      })
      .map((p) => ({
        productId: p.productId ?? 0,
        product: p,
        selected: false,
        quantity: p.allocatedQuantity ?? 1,
        maxQuantity: p.allocatedQuantity ?? 1,
        reason: 'CHANGED_MIND' as ReturnReason,
        comments: '',
      }));
  }, [shipment]);

  const [products, setProducts] = useState<ReturnProductSelection[]>(initialProducts);

  // Reset products when shipment changes
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Check if any product is selected
  const hasSelectedProducts = useMemo(() => {
    return products.some((p) => p.selected);
  }, [products]);

  // Validate that all selected products have valid data
  const isValid = useMemo(() => {
    if (!hasSelectedProducts) return false;

    return products
      .filter((p) => p.selected)
      .every((p) => p.quantity > 0 && p.quantity <= p.maxQuantity && p.reason);
  }, [products, hasSelectedProducts]);

  // Handle checkbox change
  const handleSelectChange = useCallback((productId: number, checked: boolean) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, selected: checked } : p
      )
    );
  }, []);

  // Handle quantity change
  const handleQuantityChange = useCallback((productId: number, value: string) => {
    const qty = parseInt(value, 10);
    if (isNaN(qty) || qty < 0) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId
          ? { ...p, quantity: Math.min(qty, p.maxQuantity) }
          : p
      )
    );
  }, []);

  // Handle reason change
  const handleReasonChange = useCallback((productId: number, value: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, reason: value } : p
      )
    );
  }, []);

  // Handle comments change
  const handleCommentsChange = useCallback((productId: number, value: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.productId === productId ? { ...p, comments: value } : p
      )
    );
  }, []);

  // Handle dimension change
  const handleDimensionChange = useCallback((field: keyof typeof dimensions, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) return;
    setDimensions((prev) => ({ ...prev, [field]: numValue }));
  }, []);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!shipment?.shipmentId || !isValid) return;

    setLoading(true);
    try {
      const selectedProducts: ReturnProductItem[] = products
        .filter((p) => p.selected)
        .map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          reason: p.reason,
          comments: p.comments || undefined,
        }));

      const request: CreateReturnRequest = {
        shipmentId: shipment.shipmentId,
        products: selectedProducts,
        length: dimensions.length,
        breadth: dimensions.breadth,
        height: dimensions.height,
        weight: dimensions.weight,
      };

      await shipmentApi.createReturn(request);

      toast.success('Return order created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating return:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create return order';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [shipment, products, dimensions, isValid, onSuccess, onClose]);

  // Calculate totals
  const selectedCount = products.filter((p) => p.selected).length;
  const totalQuantity = products
    .filter((p) => p.selected)
    .reduce((sum, p) => sum + p.quantity, 0);

  if (!shipment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { maxHeight: '90vh' } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Generate Return Order</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {products.length === 0 ? (
          <Alert severity="info">
            No returnable products found in this shipment. Products must have "Returns Allowed" enabled.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Shipment Info */}
            <Box>
              <Typography variant="body2" color="text.secondary">
                Shipment #{shipment.shipmentId} | AWB: {shipment.shipRocketAwbCode || 'N/A'}
              </Typography>
            </Box>

            {/* Products Selection */}
            <Box>
              <Subheader label="Select Products to Return" />
              <Divider sx={{ mb: 2 }} />

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'action.hover' }}>
                      <TableCell padding="checkbox" sx={{ width: 50 }}></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Qty</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Max Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 200 }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 250 }}>Comments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((item) => (
                      <TableRow
                        key={item.productId}
                        sx={{
                          backgroundColor: item.selected ? 'action.selected' : 'inherit',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={item.selected}
                            onChange={(e) => handleSelectChange(item.productId, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.product.mainImageUrl && (
                              <Box
                                component="img"
                                src={item.product.mainImageUrl}
                                alt={item.product.title}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                }}
                              />
                            )}
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {item.product.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.product.upc || 'N/A'} | ₹{item.product.price?.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                            disabled={!item.selected}
                            inputProps={{ min: 1, max: item.maxQuantity }}
                            sx={{ width: 70 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{item.maxQuantity}</Typography>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth disabled={!item.selected}>
                            <InputLabel>Reason</InputLabel>
                            <Select
                              value={item.reason}
                              label="Reason"
                              onChange={(e: SelectChangeEvent) =>
                                handleReasonChange(item.productId, e.target.value)
                              }
                            >
                              {RETURN_REASON_OPTIONS.map((r) => (
                                <MenuItem key={r.value} value={r.value}>
                                  {r.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Additional comments..."
                            value={item.comments}
                            onChange={(e) => handleCommentsChange(item.productId, e.target.value)}
                            disabled={!item.selected}
                            multiline
                            maxRows={2}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Package Dimensions */}
            <Box>
              <Subheader label="Return Package Dimensions" />
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Length (cm)"
                    type="number"
                    size="small"
                    fullWidth
                    value={dimensions.length}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Breadth (cm)"
                    type="number"
                    size="small"
                    fullWidth
                    value={dimensions.breadth}
                    onChange={(e) => handleDimensionChange('breadth', e.target.value)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Height (cm)"
                    type="number"
                    size="small"
                    fullWidth
                    value={dimensions.height}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Weight (kg)"
                    type="number"
                    size="small"
                    fullWidth
                    value={dimensions.weight}
                    onChange={(e) => handleDimensionChange('weight', e.target.value)}
                    inputProps={{ min: 0.1, step: 0.1 }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Summary */}
            {hasSelectedProducts && (
              <Box sx={{ backgroundColor: 'action.hover', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Selected Products:</strong> {selectedCount} | <strong>Total Quantity:</strong> {totalQuantity}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <RedButton
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          label="Cancel"
        />
        <BlueButton
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !isValid}
          label={loading ? 'Creating Return...' : 'Create Return Order'}
        />
      </DialogActions>
    </Dialog>
  );
};

export default ReturnShipmentModal;
