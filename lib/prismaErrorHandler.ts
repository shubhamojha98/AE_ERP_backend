import HttpStatus from "./httpStatus";

/**
 * Enterprise Prisma Error Handler
 * Translates technical DB codes into human-readable business errors.
 */
export const handlePrismaError = (err: any) => {
  console.error('[Database Error]:', err);

  const meta = err.meta || {};
  
  switch (err.code) {
    case 'P2002': {
      // Unique constraint failed
      const target = meta.target ? meta.target[0] : 'field';
      return {
        status: HttpStatus.BadRequest,
        message: `The provided ${target} is already in use. Please use a unique ${target}.`
      };
    }

    case 'P2003': {
      // Foreign key constraint failed
      let field = 'record';
      const constraint = meta.constraint || '';
      
      if (constraint.includes('role_id')) field = 'Role ID';
      else if (constraint.includes('ulb_id')) field = 'ULB ID';
      else if (constraint.includes('agency_id')) field = 'Agency ID';
      else if (constraint.includes('user_id')) field = 'User ID';
      else if (constraint.includes('module_id')) field = 'Module ID';
      else if (constraint.includes('menu_id')) field = 'Menu ID';
      else if (constraint.includes('menu_action_id')) field = 'Menu Action ID';

      return {
        status: HttpStatus.BadRequest,
        message: `Relationship Failure: The provided ${field} does not exist in the database. Please verify your IDs.`
      };
    }

    case 'P2025': {
      // Record to update not found
      return {
        status: HttpStatus.NotFound,
        message: "Operation Failed: The target record could not be found in the database."
      };
    }

    case 'P2000': {
      // The provided value for the column is too long
      const target = meta.target ? meta.target[0] : 'field';
      return {
        status: HttpStatus.BadRequest,
        message: `Data Integrity: The value for '${target}' is too long for the database.`
      };
    }

    default:
      return {
        status: HttpStatus.InternalServerError,
        message: err.message || "An unexpected database error occurred. Contact system administrator."
      };
  }
};
