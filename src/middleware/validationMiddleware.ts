import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";
import Joi, { ObjectSchema } from "joi";

export const validate =
  (schema: AnyZodObject | ObjectSchema<any>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    // If it's a Zod schema
    if ("safeParse" in schema) {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ error: result.error.errors });
        return;
      }
      next();
      return;
    }
    // If it's a Joi schema
    if ("validate" in schema) {
      const { error } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        res.status(400).json({ error: error.details });
        return;
      }
      next();
      return;
    }
    // Unknown schema type
    res.status(500).json({ error: "Invalid validation schema" });
    return;
  };
