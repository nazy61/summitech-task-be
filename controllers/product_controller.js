const Product = require("../models/Product");
const Stock = require("../models/Stock");
const Joi = require("joi");

module.exports.get_products = async (req, res) => {
  const perPage = req.query.perPage || 5;
  const page = req.query.page || 1;
  const query = {
    name: { $regex: req.query.name?.trim() ?? "", $options: "i" },
  };
  try {
    const products = await Product.find(query)
      .skip(perPage * page - perPage)
      .limit(perPage)
      .populate("stocks");

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

module.exports.get_stocks = async (req, res) => {
  const perPage = req.query.perPage || 5;
  const page = req.query.page || 1;
  const query = {
    $and: [
      { quantity: { $gt: req.query.min ?? 0 } },
      { quantity: { $lt: req.query.max ?? Number.MAX_VALUE } },
    ],
  };
  try {
    const stocks = await Stock.find(query)
      .skip(perPage * page - perPage)
      .limit(perPage);

    const count = await Stock.count();

    return res.send({
      success: true,
      message: "Stocks fetched successfully",
      currentPage: page,
      perPage,
      totalPages: Math.ceil(count / perPage),
      totalResults: count,
      data: stocks,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.get_product_stocks = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await Product.findById(productId).populate("stocks");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    const min = req.query.min || 0;
    const max = req.query.max || Number.MAX_VALUE;

    const stocks = product.stocks.filter(
      (stock) => stock.quantity > min && stock.quantity < max
    );

    return res.send({
      success: true,
      message: "Stocks fetched successfully",
      data: stocks,
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
    const product = await Product.findById(productId).populate("stocks");

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
    if (error.keyValue.name != null && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product Name already exists!",
      });
    }
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
    if (error.keyValue.name != null && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product Name already exists!",
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports.add_stock = async (req, res) => {
  const schema = Joi.object().keys({
    quantity: Joi.number().min(1).required().messages({
      "any.required": "Stock quantity must be more than 0",
    }),
    productId: Joi.string().required().messages({
      "any.required": "Product ID must be provided",
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
    const product = await Product.findById(req.body.productId);

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    const stock = await Stock.create({
      batchId: Math.random().toString(36).slice(2, 8).toUpperCase(),
      quantity: req.body.quantity,
    });

    const stocks = product.stocks;
    stocks.push(stock);
    product.stocks = stocks;
    await product.save();

    return res.json({
      success: true,
      message: "Stock update successful",
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

module.exports.delete_stock = async (req, res) => {
  const schema = Joi.object().keys({
    productId: Joi.string().required().messages({
      "any.required": "Product ID must be provided",
    }),
    stockId: Joi.string().required().messages({
      "any.required": "Stock ID must be provided",
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
    let product = await Product.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.stocks.includes(req.body.stockId)) {
      return res.status(404).json({
        success: false,
        message: "Stock does not belong to this product",
      });
    }

    await Stock.deleteOne({ _id: req.body.stockId });

    const stocks = product.stocks.filter((stock) => stock !== req.body.stockId);

    product.stocks = stocks;

    return res.json({
      success: true,
      message: "Stock deleted!",
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
