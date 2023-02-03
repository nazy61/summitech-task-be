const Product = require("../models/Product");
const Joi = require("joi");

module.exports.get_products = async (req, res) => {
  const perPage = req.query.perPage || 5;
  const page = req.query.page || 1;
  const query = {
    fullName: { $regex: req.query.name?.trim() ?? "", $options: "i" },
  };
  try {
    const products = await Product.find(query)
      .skip(perPage * page - perPage)
      .limit(perPage);

    const count = await Product.count();

    return res.send({
      success: true,
      message: "Products fetched successfully",
      currentPage: page,
      perPage,
      totalPages: Math.ceil(count / perPage),
      totalResults: count,
      data: products,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.get_product = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    return res.json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.create_product = async (req, res) => {
  const schema = Joi.object().keys({
    name: Joi.string().required().messages({
      "any.required": "Product name must be provided",
    }),
    price: Joi.number()
      .required()
      .messages({ "any.required": "Product price must be provided" }),
    description: Joi.string().required().messages({
      "any.required": "Product description must be provided",
    }),
    imageUrl: Joi.string().required().messages({
      "any.required": "Product imageUrl must be provided",
    }),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send({
      success: false,
      message: result.error.details[0].message,
    });
  }

  try {
    const product = await Product.create(req.body);

    return res.json({
      success: true,
      message: "Product created",
      data: product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.update_product = async (req, res) => {
  const { productId } = req.params;
  const schema = Joi.object().keys({
    name: Joi.string().messages({
      "any.required": "Product name must not be empty or null",
    }),
    price: Joi.number()
      .required()
      .messages({ "any.required": "Product price must not be empty or null" }),
    description: Joi.string().required().messages({
      "any.required": "Product description must not be empty or null",
    }),
    imageUrl: Joi.string().required().messages({
      "any.required": "Product imageUrl must not be empty or null",
    }),
  });

  const result = schema.validate(req.body);

  if (result.error) {
    return res.status(400).send({
      success: false,
      message: result.error.details[0].message,
    });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    product.name = req.body.name;
    product.price = req.body.price;
    product.description = req.body.description;
    product.imageUrl = req.body.imageUrl;
    await product.save();

    return res.json({
      success: true,
      message: "Product update successful",
      data: product,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.delete_product = async (req, res) => {
  const { productId } = req.params;
  try {
    await Product.deleteOne({ _id: productId });

    return res.json({
      success: true,
      message: "Product deleted!",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
