import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { Cancel as CancelIcon, Save as SaveIcon } from '@mui/icons-material'
import { Box, Container, Paper } from '@mui/material'

import { productApi } from '../../api/productApi'
import { BlueButton, RedButton } from '../../components/buttons'
import { FieldType, FormFieldRenderer, RichTextEditor, type SectionConfig } from '../../components/form'
import { COUNTRIES, PERMISSIONS, PRODUCT_CONDITION_OPTIONS } from '../../constants/appConstants'
import { APP_ROUTES } from '../../constants/routes'
import { usePermissions } from '../../hooks/usePermissions'
import type { ProductRequestModel, ProductResponseModel } from '../../models/api-models'
import styles from '../../styles/Products.module.scss'
import { productFormSchema, type ProductFormData } from '../../utils/validationSchemas'

import {
  CategoryAutocomplete,
  ColorAutocomplete,
  FillTestDataButton,
  PickupLocationQuantityManager,
  ProductDetailsView,
} from './components'

/**
 * Add/Edit/View Product Page
 * Features:
 * - Create new product
 * - Edit existing product
 * - View product details (read-only)
 * - Product information sections
 * - Multiple product images (8 required + 4 optional)
 * - Pricing and discount configuration
 * - Dimensions and weight
 * - Pickup location management
 * - Category selection
 */
const AddEditProduct = (): React.JSX.Element => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const productId = searchParams.get('productId')
  const isView = searchParams.has('isView')
  const isEdit = !!productId && !isView

  const [loading, setLoading] = useState(false)
  const [categoryParentId, setCategoryParentId] = useState<number | null>(null)

  // Get user permissions for authorization
  const { hasPermission } = usePermissions()

  // Use ref to track if permission check has been performed
  const hasCheckedPermissions = useRef(false)
  const hasFetchedProductDetails = useRef(false)

  // Check permissions on mount and redirect if unauthorized
  useEffect(() => {
    if (hasCheckedPermissions.current) {
      return
    }

    let requiredPermission: string | null = null

    if (isView) {
      requiredPermission = PERMISSIONS.VIEW_PRODUCTS
    } else if (isEdit) {
      requiredPermission = PERMISSIONS.UPDATE_PRODUCTS
    } else {
      requiredPermission = PERMISSIONS.INSERT_PRODUCTS
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      hasCheckedPermissions.current = true
      toast.error('You do not have permission to access this page')
      navigate(APP_ROUTES.DASHBOARD.PRODUCTS, { replace: true })
    } else if (requiredPermission) {
      hasCheckedPermissions.current = true
    }
  }, [hasPermission, isView, isEdit, navigate])

  // Form setup with react-hook-form and Zod validation
  const formMethods = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      title: '',
      descriptionHtml: '',
      brand: '',
      color: '',
      colorLabel: '',
      condition: '',
      countryOfManufacture: '',
      model: '',
      upc: '',
      modificationHtml: '',
      itemModified: false,
      price: 0,
      discount: 0,
      isDiscountPercent: false,
      returnsAllowed: false,
      length: undefined,
      breadth: undefined,
      height: undefined,
      weightKgs: undefined,
      categoryId: 0,
      categoryFullPath: '',
      mainImage: '',
      topImage: '',
      bottomImage: '',
      frontImage: '',
      backImage: '',
      rightImage: '',
      leftImage: '',
      detailsImage: '',
      defectImage: '',
      additionalImage1: '',
      additionalImage2: '',
      additionalImage3: '',
      pickupLocationQuantities: {},
      notes: '',
      itemAvailableFrom: {
        dateTime: null,
        timezone: 'Asia/Kolkata',
      },
    },
  })
  const { control, handleSubmit: handleFormSubmit, formState, reset, watch, setValue } = formMethods
  const errors = formState.errors as Record<string, { message?: string } | undefined>

  // Watch all form values for view mode
  const watchedValues: ProductFormData = watch()

  // Convert condition options to field options format
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
  const conditionOptions = useMemo(
    () =>
      PRODUCT_CONDITION_OPTIONS.map(opt => ({
        value: opt.value,
        label: opt.label,
      })),
    [],
  )

  // Convert countries to field options format
  const countryOptions = useMemo(
    () =>
      COUNTRIES.map(country => ({
        value: country,
        label: country,
      })),
    [],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */

  /**
   * Handle pickup location quantity changes
   */
  const handlePickupLocationQuantitiesChange = useCallback(
    (newValue: Record<number, number>) => {
      setValue('pickupLocationQuantities', newValue, { shouldValidate: true })
    },
    [setValue],
  )

  /**
   * Fetch product details if editing or viewing
   */
  const fetchProductDetails = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true)
      try {
        /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
        const response = (await productApi.getProductById(parseInt(id, 10))) as ProductResponseModel

        // Convert pickupLocations array to pickupLocationQuantities Record<number, number>
        const pickupLocationQuantities: Record<number, number> = {}
        if (response.pickupLocations && Array.isArray(response.pickupLocations)) {
          for (const item of response.pickupLocations) {
            const locationId = item.pickupLocation?.pickupLocationId
            const stock = item.availableStock
            if (locationId != null && stock != null) {
              pickupLocationQuantities[locationId] = stock
            }
          }
        }

        // Reset form with product data
        reset({
          productId: response.productId,
          title: response.title,
          descriptionHtml: response.descriptionHtml,
          brand: response.brand,
          color: response.color ?? '',
          colorLabel: response.colorLabel ?? '',
          condition: response.condition,
          countryOfManufacture: response.countryOfManufacture,
          model: response.model ?? '',
          upc: response.upc ?? '',
          modificationHtml: response.modificationHtml ?? '',
          itemModified: response.itemModified,
          price: response.price,
          discount: response.discount,
          isDiscountPercent: response.isDiscountPercent,
          returnsAllowed: response.returnsAllowed,
          length: response.length,
          breadth: response.breadth,
          height: response.height,
          weightKgs: response.weightKgs,
          categoryId: response.categoryId,
          mainImage: response.mainImageUrl,
          topImage: response.topImageUrl,
          bottomImage: response.bottomImageUrl,
          frontImage: response.frontImageUrl,
          backImage: response.backImageUrl,
          rightImage: response.rightImageUrl,
          leftImage: response.leftImageUrl,
          detailsImage: response.detailsImageUrl,
          defectImage: response.defectImageUrl ?? '',
          additionalImage1: response.additionalImage1Url ?? '',
          additionalImage2: response.additionalImage2Url ?? '',
          additionalImage3: response.additionalImage3Url ?? '',
          pickupLocationQuantities,
          notes: response.notes ?? '',
          itemAvailableFrom: {
            dateTime: response.itemAvailableFrom ? new Date(response.itemAvailableFrom) : null,
            timezone: response.itemAvailableFromTimezone ?? 'Asia/Kolkata',
          },
          categoryFullPath: response.category?.fullPath ?? response.category?.name ?? '',
        })
        /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

        toast.success('Product details loaded successfully')
      } catch {
        toast.error('Failed to fetch product details')
        navigate(APP_ROUTES.DASHBOARD.PRODUCTS, { replace: true })
      } finally {
        setLoading(false)
      }
    },
    [reset, navigate],
  )

  // Fetch product details on mount (edit/view mode)
  useEffect(() => {
    if (productId && !hasFetchedProductDetails.current) {
      hasFetchedProductDetails.current = true
      void fetchProductDetails(productId)
    }
  }, [productId, fetchProductDetails])

  /**
   * Handle form submission
   */
  const onSubmit = useCallback(
    async (formData: ProductFormData): Promise<void> => {
      setLoading(true)
      try {
        const requestData: ProductRequestModel = {
          productId: isEdit && productId ? parseInt(productId) : undefined,
          title: formData.title,
          descriptionHtml: formData.descriptionHtml,
          brand: formData.brand,
          color: formData.color,
          colorLabel: formData.colorLabel,
          condition: formData.condition,
          countryOfManufacture: formData.countryOfManufacture,
          model: formData.model ?? undefined,
          upc: formData.upc ?? undefined,
          modificationHtml: formData.modificationHtml ?? undefined,
          itemModified: formData.itemModified,
          price: formData.price,
          discount: formData.discount,
          isDiscountPercent: formData.isDiscountPercent,
          returnsAllowed: formData.returnsAllowed,
          length: typeof formData.length === 'number' && !Number.isNaN(formData.length) ? formData.length : undefined,
          breadth:
            typeof formData.breadth === 'number' && !Number.isNaN(formData.breadth) ? formData.breadth : undefined,
          height: typeof formData.height === 'number' && !Number.isNaN(formData.height) ? formData.height : undefined,
          weightKgs:
            typeof formData.weightKgs === 'number' && !Number.isNaN(formData.weightKgs)
              ? formData.weightKgs
              : undefined,
          categoryId: formData.categoryId,
          mainImage: formData.mainImage,
          topImage: formData.topImage,
          bottomImage: formData.bottomImage,
          frontImage: formData.frontImage,
          backImage: formData.backImage,
          rightImage: formData.rightImage,
          leftImage: formData.leftImage,
          detailsImage: formData.detailsImage,
          defectImage: formData.defectImage ?? undefined,
          additionalImage1: formData.additionalImage1 ?? undefined,
          additionalImage2: formData.additionalImage2 ?? undefined,
          additionalImage3: formData.additionalImage3 ?? undefined,
          pickupLocationQuantities: formData.pickupLocationQuantities,
          notes: formData.notes ?? undefined,
          itemAvailableFrom: formData.itemAvailableFrom.dateTime?.toISOString() ?? new Date().toISOString(),
          itemAvailableFromTimezone: formData.itemAvailableFrom.timezone,
        }

        if (isEdit && productId) {
          await productApi.updateProduct(parseInt(productId), requestData)
          toast.success('Product updated successfully')
        } else {
          await productApi.createProduct(requestData)
          toast.success('Product created successfully')
        }

        navigate(APP_ROUTES.DASHBOARD.PRODUCTS)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `Failed to ${isEdit ? 'update' : 'create'} product`
        toast.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [isEdit, productId, navigate],
  )

  /**
   * Handle cancel
   */
  const handleCancel = (): void => {
    navigate(APP_ROUTES.DASHBOARD.PRODUCTS)
  }

  // Compute button text
  const buttonText = useMemo(() => {
    if (loading) return 'Saving...'
    if (isEdit) return 'Update Product'
    return 'Create Product'
  }, [loading, isEdit])

  // Form sections configuration - Basic Information
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const basicInfoSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Product Information',
        fields: [
          {
            name: 'title',
            label: 'Product Title',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            placeholder: 'Enter product title',
          },
          {
            name: 'descriptionHtml',
            label: '', // Required by TypeScript, but ignored by customContent
            type: FieldType.Text, // Required by TypeScript, but ignored by customContent
            required: true,
            gridSize: { xs: 12, sm: 12 },
            customContent: () => (
              <Controller
                name="descriptionHtml"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    label="Description"
                    error={!!errors.descriptionHtml}
                    helperText={errors.descriptionHtml?.message}
                    disabled={loading}
                    required
                    placeholder="Enter detailed product description with formatting..."
                  />
                )}
              />
            ),
          },
          {
            name: 'brand',
            label: 'Brand',
            type: FieldType.Text,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'e.g., Apple, Samsung, Nike',
          },
          {
            name: 'model',
            label: 'Model',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'e.g., iPhone 14 Pro, Galaxy S23',
          },
          {
            name: 'condition',
            label: 'Condition',
            type: FieldType.Autocomplete,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            options: conditionOptions,
            placeholder: 'Select product condition',
          },
          {
            name: 'upc',
            label: 'UPC',
            type: FieldType.Text,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'Universal Product Code',
          },
          {
            name: 'color',
            gridSize: {
              xs: 12,
              sm: 6,
            },
            customContent: () => (
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <ColorAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.color}
                    helperText={errors.color?.message}
                    disabled={loading}
                    required
                  />
                )}
              />
            ),
          },
          {
            name: 'countryOfManufacture',
            label: 'Country of Manufacture',
            type: FieldType.Autocomplete,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            options: countryOptions,
            placeholder: 'Select country',
          },
          {
            name: 'categoryId',
            label: '', // Required by TypeScript, but ignored by customContent
            required: true,
            gridSize: { xs: 12, sm: 6 },
            customContent: () => (
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <CategoryAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.categoryId}
                    helperText={errors.categoryId?.message}
                    disabled={loading}
                    required
                    initialSelectedCategoryName={watchedValues.categoryFullPath ?? ''}
                    initialParentId={categoryParentId}
                  />
                )}
              />
            ),
          },
          {
            name: 'itemModified',
            label: 'Item Modified',
            type: FieldType.Switch,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            switchLabel: 'This item has been modified',
            switchLabelPlacement: 'end',
          },
          {
            name: 'modificationHtml',
            label: '', // Required by TypeScript, but ignored by customContent
            type: FieldType.Text, // Required by TypeScript, but ignored by customContent
            required: false,
            gridSize: { xs: 12, sm: 12 },
            customContent: () => (
              <Controller
                name="modificationHtml"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    label="Modification Details"
                    error={!!errors.modificationHtml}
                    helperText={errors.modificationHtml?.message}
                    disabled={loading}
                    required={false}
                    placeholder="Describe any modifications made to the item..."
                  />
                )}
              />
            ),
          },
        ],
      },
    ],
    [conditionOptions, countryOptions, watchedValues.categoryFullPath, categoryParentId],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Form sections configuration - Pricing
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const pricingSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Pricing & Stock',
        fields: [
          {
            name: 'price',
            label: 'Price (₹)',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'Enter product price',
          },
          {
            name: 'discount',
            label: 'Discount',
            type: FieldType.Number,
            required: true,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            placeholder: 'Enter discount value',
          },
          {
            name: 'isDiscountPercent',
            label: 'Discount Type',
            type: FieldType.Switch,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            switchLabel: 'Percentage Discount',
            switchLabelPlacement: 'end',
          },
          {
            name: 'returnsAllowed',
            label: 'Returns',
            type: FieldType.Switch,
            required: false,
            gridSize: {
              xs: 12,
              sm: 6,
            },
            switchLabel: 'Returns Allowed',
            switchLabelPlacement: 'end',
          },
          {
            name: 'itemAvailableFrom',
            label: 'Available From',
            type: FieldType.DateTime,
            required: true,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            dateTimeLabel: 'Product Available From',
            timezoneLabel: 'Timezone',
            minDateTime: new Date(),
          },
        ],
      },
    ],
    [],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Form sections configuration - Dimensions
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const dimensionsSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Dimensions & Weight',
        fields: [
          {
            name: 'length',
            label: 'Length (cm)',
            type: FieldType.Number,
            required: false,
            gridSize: {
              xs: 12,
              sm: 3,
            },
            placeholder: 'Length in cm',
          },
          {
            name: 'breadth',
            label: 'Breadth (cm)',
            type: FieldType.Number,
            required: false,
            gridSize: {
              xs: 12,
              sm: 3,
            },
            placeholder: 'Breadth in cm',
          },
          {
            name: 'height',
            label: 'Height (cm)',
            type: FieldType.Number,
            required: false,
            gridSize: {
              xs: 12,
              sm: 3,
            },
            placeholder: 'Height in cm',
          },
          {
            name: 'weightKgs',
            label: 'Weight (kg)',
            type: FieldType.Number,
            required: false,
            gridSize: {
              xs: 12,
              sm: 3,
            },
            placeholder: 'Weight in kg',
          },
        ],
      },
    ],
    [],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Form sections configuration - Pickup Locations
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const pickupLocationsSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Stock',
        fields: [],
        customContent: (
          <PickupLocationQuantityManager
            value={watchedValues.pickupLocationQuantities || {}}
            onChange={handlePickupLocationQuantitiesChange}
            disabled={loading}
          />
        ),
      },
    ],
    [watchedValues.pickupLocationQuantities, handlePickupLocationQuantitiesChange, loading],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Form sections configuration - Images (Required)
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const requiredImagesSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Product Images (Required)',
        fields: [
          {
            name: 'mainImage',
            label: 'Main Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'topImage',
            label: 'Top Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'bottomImage',
            label: 'Bottom Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'frontImage',
            label: 'Front Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'backImage',
            label: 'Back Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'rightImage',
            label: 'Right Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'leftImage',
            label: 'Left Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'detailsImage',
            label: 'Details Image',
            type: FieldType.Image,
            required: true,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
        ],
      },
    ],
    [],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Form sections configuration - Images (Optional)
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const optionalImagesSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Additional Images (Optional)',
        fields: [
          {
            name: 'defectImage',
            label: 'Defect Image',
            type: FieldType.Image,
            required: false,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'additionalImage1',
            label: 'Additional Image 1',
            type: FieldType.Image,
            required: false,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'additionalImage2',
            label: 'Additional Image 2',
            type: FieldType.Image,
            required: false,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
          {
            name: 'additionalImage3',
            label: 'Additional Image 3',
            type: FieldType.Image,
            required: false,
            gridSize: {
              xs: 12,
              sm: 4,
            },
            imageSize: 150,
            maxSizeMB: 5,
          },
        ],
      },
    ],
    [],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  // Notes section
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  const notesSection = useMemo<Array<SectionConfig<ProductFormData>>>(
    () => [
      {
        title: 'Notes',
        fields: [
          {
            name: 'notes',
            label: 'Notes',
            type: FieldType.Textarea,
            required: false,
            gridSize: {
              xs: 12,
              sm: 12,
            },
            rows: 4,
            placeholder: 'Any additional notes or comments about this product (optional)',
          },
        ],
      },
    ],
    [],
  )
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        px: {
          xs: 2,
          sm: 3,
          md: 4,
        },
      }}
    >
      <form onSubmit={handleFormSubmit(onSubmit)}>
        <Box
          sx={{
            paddingTop: 4,
            paddingBottom: 4,
          }}
        >
          {isView ? (
            // View Mode - Product Details
            <ProductDetailsView watchedValues={watchedValues} />
          ) : (
            <>
              {/* Edit/Add Mode - Form Sections */}
              <FormFieldRenderer<ProductFormData>
                sections={basicInfoSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />

              <FormFieldRenderer<ProductFormData>
                sections={pricingSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />

              <FormFieldRenderer<ProductFormData>
                sections={dimensionsSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />

              <FormFieldRenderer<ProductFormData>
                sections={pickupLocationsSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />

              <FormFieldRenderer<ProductFormData>
                sections={requiredImagesSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />

              <FormFieldRenderer<ProductFormData>
                sections={optionalImagesSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />

              <FormFieldRenderer<ProductFormData>
                sections={notesSection}
                control={control}
                errors={errors}
                disabled={loading}
                isView={false}
                sectionClassName={styles['products-page__section']}
                sectionTitleClassName={styles['products-page__section-title']}
                dividerClassName={styles['products-page__divider']}
              />
            </>
          )}

          {/* Action Buttons */}
          {!isView && (
            <Paper className={styles['products-page__section']}>
              <Box className={styles['products-page__actions']}>
                <RedButton
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={loading}
                  className={styles['products-page__action-button']}
                  type="button"
                  label="Cancel"
                />
                <BlueButton
                  variant="contained"
                  startIcon={<SaveIcon />}
                  type="submit"
                  disabled={loading}
                  className={styles['products-page__action-button']}
                  label={buttonText}
                />
              </Box>
            </Paper>
          )}

        </Box>
      </form>

      {/* Fill Test Data Button - Only show in add/edit mode */}
      {!isView && (
        <FillTestDataButton
          setValue={setValue}
          onCategoryParentIdChange={setCategoryParentId}
        />
      )}
    </Container>
  )
}

export default AddEditProduct
