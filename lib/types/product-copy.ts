export interface ProductListCopy {
  title: string;
  subtitle: string;
  addButton: string;
  searchPlaceholder: string;
  categoryAll: string;
  statusAll: string;
  empty: { title: string; description: string };
  stockLabel: string;
  editButton: string;
  deleteConfirm: string;
  deleteSuccess: string;
  deleteError: string;
}

export interface ProductFormFieldCopy {
  label: string;
  placeholder?: string;
  hint?: string;
}

export interface ProductFormCopy {
  createTitle: string;
  createSubtitle: string;
  editTitle: string;
  editSubtitle: string;
  sections: {
    basic: string;
    pricing: string;
    media: string;
    organize: string;
  };
  fields: {
    title: ProductFormFieldCopy;
    shortDescription: ProductFormFieldCopy;
    description: ProductFormFieldCopy;
    price: ProductFormFieldCopy;
    comparePrice: ProductFormFieldCopy;
    stock: ProductFormFieldCopy;
    category: ProductFormFieldCopy;
    status: ProductFormFieldCopy;
    tags: ProductFormFieldCopy;
    images: ProductFormFieldCopy & {
      uploadCta: string;
      dragHint: string;
      formats: string;
      primary: string;
      setPrimary: string;
      remove: string;
    };
  };
  errors: {
    titleRequired: string;
    titleTooShort: string;
    priceRequired: string;
    priceInvalid: string;
    stockInvalid: string;
    imageRequired: string;
    imageTooLarge: string;
    imageInvalidType: string;
  };
  submit: {
    create: string;
    creating: string;
    update: string;
    updating: string;
  };
  cancel: string;
  successCreate: string;
  successUpdate: string;
  errorGeneric: string;
  categoryNew: NewCategoryCopy;
}

export interface NewCategoryCopy {
  trigger: string;
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  submit: string;
  submitting: string;
  cancel: string;
  success: string;
  errorRequired: string;
  errorDuplicate: string;
  errorGeneric: string;
}

export interface ProductCopy {
  list: ProductListCopy;
  form: ProductFormCopy;
}
