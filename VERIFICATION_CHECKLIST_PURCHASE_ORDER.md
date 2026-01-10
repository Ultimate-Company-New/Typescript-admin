# Purchase Order Verification Checklist
## Vendor Number: OFFICE-20875

### 📋 Pre-Edit Verification

Before editing, record the following values from the purchase order:

1. **Product Count**: _____ products
2. **Original Products Subtotal**: ₹_____
3. **Original Total Discount**: ₹_____
4. **Original Packaging Fee**: ₹_____
5. **Original Total Shipping**: ₹_____
6. **Original Service Fee**: ₹_____
7. **Original Subtotal (Before GST)**: ₹_____
8. **Original GST (18%)**: ₹_____
9. **Original Grand Total**: ₹_____

---

### ✏️ Edit Actions

**Changes Made:**
- Set all products to **quantity: 20**
- Set all products to **price: ₹10,000** each

**Expected Behavior:**
- Shipping allocations will be **cleared** (this is correct - shipping must be recalculated)
- Packaging fees will be **reset to 0** (will be recalculated when shipping is calculated)
- Shipping fees will be **reset to 0** (will be recalculated when shipping is calculated)

---

### ✅ Post-Edit Verification Checklist

#### 1. Product Verification

- [ ] **All products have quantity = 20**
  - Check each product card in the Products section
  - Verify quantity field shows "20" for all products

- [ ] **All products have price = ₹10,000**
  - Check each product card in the Products section
  - Verify price per unit field shows "₹10,000" for all products

- [ ] **Product subtotals are correct**
  - Each product subtotal = 20 × ₹10,000 = **₹200,000**
  - Verify this is shown correctly in each product card

#### 2. Products Subtotal Calculation

- [ ] **Products Subtotal = (Number of Products) × 20 × ₹10,000**
  - Formula: `Products Subtotal = N × 20 × 10,000`
  - Example: If 5 products → `5 × 20 × 10,000 = ₹1,000,000`
  - Verify this matches the "🛒 Products Subtotal" in Order Summary

#### 3. Discount Verification

- [ ] **Total Discount is calculated correctly**
  - If products have percentage discounts: `Discount = Products Subtotal × (discount%)`
  - If products have flat discounts: `Discount = Sum of (quantity × flatDiscount)`
  - Verify this matches the "🏷️ Total Discount" in Order Summary

#### 4. Shipping & Packaging (After Recalculation)

**⚠️ IMPORTANT:** After editing products, you MUST recalculate shipping:
1. Click "Calculate Shipping" button
2. Select couriers for each shipment
3. Confirm shipping allocations

Then verify:

- [ ] **Packaging Fee is recalculated**
  - Should come from shipping optimization API
  - Verify "📦 Packaging Fee" shows the new calculated value

- [ ] **Total Shipping is recalculated**
  - Should be sum of all selected courier rates
  - Verify "🚚 Total Shipping" shows the new calculated value

- [ ] **Shipping allocations are correct**
  - Each product should have pickup allocations
  - Quantities allocated should match product quantities (total = 20 per product)

#### 5. Service Fee

- [ ] **Service Fee is preserved** (if it was set before editing)
  - Should remain the same value as before editing
  - Verify "💼 Service Fee" shows the correct value

#### 6. Subtotal Before GST

- [ ] **Subtotal = Products (after discount) + Packaging + Shipping + Service Fee**
  - Formula: `Subtotal = (Products Subtotal - Total Discount) + Packaging Fee + Total Shipping + Service Fee`
  - Verify this matches "💰 Subtotal" in Order Summary

#### 7. GST Calculation

- [ ] **GST = 18% of Subtotal**
  - Formula: `GST = Subtotal × 0.18`
  - Verify this matches "📊 GST (18%)" in Order Summary
  - Example: If Subtotal = ₹1,000,000 → GST = ₹180,000

#### 8. Grand Total

- [ ] **Grand Total = Subtotal + GST**
  - Formula: `Grand Total = Subtotal + GST`
  - Verify this matches "✨ Grand Total" in Order Summary

---

### 🧮 Manual Calculation Example

**Scenario:** 5 products, all set to quantity 20, price ₹10,000 each

1. **Products Subtotal**: `5 × 20 × ₹10,000 = ₹1,000,000`
2. **Total Discount**: (depends on product discounts) - e.g., `₹0` if no discounts
3. **Products After Discount**: `₹1,000,000 - ₹0 = ₹1,000,000`
4. **Packaging Fee**: (from shipping API) - e.g., `₹500`
5. **Total Shipping**: (from courier selection) - e.g., `₹10,000`
6. **Service Fee**: (preserved from before) - e.g., `₹353.12`
7. **Subtotal Before GST**: `₹1,000,000 + ₹500 + ₹10,000 + ₹353.12 = ₹1,010,853.12`
8. **GST (18%)**: `₹1,010,853.12 × 0.18 = ₹181,953.56`
9. **Grand Total**: `₹1,010,853.12 + ₹181,953.56 = ₹1,192,806.68`

---

### 🔍 Verification Formula Reference

```javascript
// Products Subtotal (before discount)
productsSubtotal = sum(product.quantity × product.pricePerUnit)

// Total Discount
totalDiscount = sum(product.discountAmount) // calculated based on discount type

// Products After Discount
productsAfterDiscount = productsSubtotal - totalDiscount

// Subtotal Before GST
subtotalBeforeGst = productsAfterDiscount + packagingFee + totalShipping + serviceFee

// GST (18%)
gstAmount = subtotalBeforeGst × 0.18

// Grand Total
grandTotal = subtotalBeforeGst + gstAmount
```

---

### ⚠️ Common Issues to Watch For

1. **Shipping not recalculated**
   - Issue: Packaging/Shipping fees remain at old values
   - Fix: Click "Calculate Shipping" and select couriers

2. **Discounts not recalculated**
   - Issue: Discount amount doesn't reflect new quantities
   - Fix: Discounts should auto-recalculate when quantity/price changes

3. **Service Fee cleared**
   - Issue: Service fee reset to 0 after product edit
   - Fix: Service fee should be preserved (this is a bug if it happens)

4. **Subtotal mismatch**
   - Issue: Subtotal doesn't match manual calculation
   - Fix: Check if all components (products, packaging, shipping, service fee) are included

---

### 📝 Notes

- After editing products, shipping MUST be recalculated
- All shipping allocations will be cleared (this is expected behavior)
- Packaging and shipping fees will be 0 until shipping is recalculated
- Product subtotals should update immediately when quantity/price changes
- Discounts should recalculate automatically based on discount type
- Service fee should be preserved across product edits

---

### ✅ Final Verification

After completing all checks above, verify:

- [ ] All products show correct quantity (20) and price (₹10,000)
- [ ] Products Subtotal matches expected calculation
- [ ] Discounts are calculated correctly
- [ ] Shipping has been recalculated (if applicable)
- [ ] Packaging Fee is correct (from shipping API)
- [ ] Total Shipping is correct (sum of courier rates)
- [ ] Service Fee is preserved
- [ ] Subtotal Before GST = Products + Packaging + Shipping + Service Fee
- [ ] GST = 18% of Subtotal
- [ ] Grand Total = Subtotal + GST
- [ ] All calculations match manual verification

---

**Date Verified**: _______________
**Verified By**: _______________
**Status**: ☐ Passed  ☐ Failed  ☐ Needs Review

