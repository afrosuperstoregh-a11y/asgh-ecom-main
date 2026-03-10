const Joi = require('joi');

const orderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().positive().required()
    })
  ).min(1).required(),
  shipping_address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postal_code: Joi.string().required(),
    country: Joi.string().required()
  }).required(),
  payment_method: Joi.string().valid('stripe', 'paypal', 'cash_on_delivery').required(),
  total_amount: Joi.number().positive().required()
});

const userUpdateSchema = Joi.object({
  first_name: Joi.string().min(1).max(50),
  last_name: Joi.string().min(1).max(50),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional()
}).min(1);

const productSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).max(2000).required(),
  price: Joi.number().positive().required(),
  category_id: Joi.number().integer().positive().required(),
  inventory_count: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  specifications: Joi.object().optional(),
  is_active: Joi.boolean().default(true)
});

const categorySchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  parent_id: Joi.number().integer().positive().allow(null).optional(),
  is_active: Joi.boolean().default(true)
});

const validateOrder = (data) => orderSchema.validate(data);
const validateUserUpdate = (data) => userUpdateSchema.validate(data);
const validateProduct = (data) => productSchema.validate(data);
const validateCategory = (data) => categorySchema.validate(data);

module.exports = {
  validateOrder,
  validateUserUpdate,
  validateProduct,
  validateCategory
};
