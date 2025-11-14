# Bulk User Import API Specification

## Overview
This document defines the JSON structure for the bulk user import API endpoint.

## Endpoint
```
POST /api/User/bulkImportUsers
```

## Request Headers
```
Content-Type: application/json
Authorization: Bearer <token>
```

## Request Body Structure

### TypeScript Interface
```typescript
interface BulkUserImportRequest {
  maxRecords: number
  users: Array<{
    firstName: string
    lastName: string
    email: string
    phone: string
    role: string
    dob: string  // Format: YYYY-MM-DD
    address: {
      street1: string
      street2?: string
      city: string
      state: string
      zipCode: string
      country?: string
      isPrimary: boolean
    }
    permissionIds: number[]
    selectedGroupIds: number[]
  }>
}
```

### JSON Example
```json
{
  "maxRecords": 100,
  "users": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "role": "Manager",
      "dob": "1990-01-15",
      "address": {
        "street1": "123 Main St",
        "street2": "Apt 4B",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "isPrimary": true
      },
      "permissionIds": [1, 2, 3, 5, 8],
      "selectedGroupIds": [1, 2]
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane.smith@example.com",
      "phone": "0987654321",
      "role": "Employee",
      "dob": "1992-05-20",
      "address": {
        "street1": "456 Oak Ave",
        "city": "Los Angeles",
        "state": "CA",
        "zipCode": "90001",
        "country": "USA",
        "isPrimary": true
      },
      "permissionIds": [1, 2, 5],
      "selectedGroupIds": [2, 3]
    }
  ]
}
```

## Field Descriptions

### Root Level
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| maxRecords | number | Yes | Maximum number of records to process in this batch |
| users | Array | Yes | Array of user objects to import |

### User Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | Yes | User's first name |
| lastName | string | Yes | User's last name |
| email | string | Yes | User's email address (must be unique) |
| phone | string | Yes | User's phone number (10 digits) |
| role | string | Yes | User's role (e.g., Manager, Employee, Admin, CEO, Customer, Custom) |
| dob | string | Yes | Date of birth in YYYY-MM-DD format |
| address | object | Yes | User's address information |
| permissionIds | number[] | Yes | Array of permission IDs to assign to the user |
| selectedGroupIds | number[] | No | Array of user group IDs the user should belong to |

### Address Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| street1 | string | Yes | Primary street address |
| street2 | string | No | Secondary address line (apartment, suite, etc.) |
| city | string | Yes | City name |
| state | string | Yes | State code (e.g., NY, CA) |
| zipCode | string | Yes | ZIP/Postal code |
| country | string | No | Country name (defaults to "USA") |
| isPrimary | boolean | Yes | Whether this is the primary address |

## Response Structure

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Successfully imported 50 users",
  "summary": {
    "totalRequested": 50,
    "successfulImports": 48,
    "failedImports": 2,
    "errors": [
      {
        "rowNumber": 15,
        "email": "duplicate@example.com",
        "error": "Email already exists"
      },
      {
        "rowNumber": 32,
        "email": "invalid@example",
        "error": "Invalid email format"
      }
    ]
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "BAD_REQUEST",
  "message": "Invalid request data",
  "details": "maxRecords must be between 1 and 1000"
}
```

## Validation Rules

### Email
- Must be unique across the system
- Must be a valid email format
- Required field

### Phone
- Must be 10 digits
- Can be formatted or unformatted
- Required field

### Role
- Must be one of: Manager, Employee, Admin, CEO, Customer, Custom
- Required field

### Date of Birth
- Must be in YYYY-MM-DD format
- Must be a valid date
- User must be at least 18 years old
- Required field

### Permission IDs
- Must reference existing permission IDs in the database
- At least one permission must be assigned
- Invalid IDs will be skipped with a warning

### Group IDs
- Must reference existing group IDs in the database
- Optional field
- Invalid IDs will be skipped with a warning

### Max Records
- Must be between 1 and 1000
- Limits the number of users processed in a single request

## Backend Implementation Notes

### Java Spring API Endpoint Structure
```java
@PostMapping("/bulkImportUsers")
@PreAuthorize("@customAuthorization.hasAuthority('"+ Authorizations.INSERT_USER_PERMISSION +"')")
public ResponseEntity<?> bulkImportUsers(@RequestBody BulkUserImportRequestModel request) {
    try {
        BulkImportResultModel result = userService.bulkImportUsers(request);
        return ResponseEntity.ok(result);
    } catch (BadRequestException bre) {
        logger.error(bre);
        return ResponseEntity.badRequest()
            .body(new ErrorResponseModel(
                ErrorMessages.ERROR_BAD_REQUEST, 
                bre.getMessage(), 
                HttpStatus.BAD_REQUEST.value()
            ));
    } catch (Exception e) {
        logger.error(e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponseModel(
                ErrorMessages.ERROR_INTERNAL_SERVER_ERROR, 
                e.getMessage(), 
                HttpStatus.INTERNAL_SERVER_ERROR.value()
            ));
    }
}
```

### Request Model Classes
```java
@Getter
@Setter
public class BulkUserImportRequestModel {
    private Integer maxRecords;
    private List<BulkUserData> users;
}

@Getter
@Setter
public class BulkUserData {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String role;
    private String dob;
    private AddressRequestModel address;
    private List<Long> permissionIds;
    private List<Long> selectedGroupIds;
}
```

### Service Implementation Strategy
1. Validate maxRecords limit
2. Loop through each user in the array
3. For each user:
   - Validate all required fields
   - Check for duplicate email
   - Create user entity
   - Generate password and send confirmation email
   - Create address
   - Create permission mappings
   - Create group mappings
   - Log success/failure
4. Return summary with success count and error details

### Transaction Management
- Use `@Transactional` annotation
- Consider batch processing for large imports
- Implement rollback strategy for critical failures
- Log each user creation for audit trail

## CSV Template Format

The CSV template should have the following columns in order:

```csv
firstName,lastName,email,phone,role,dob,street1,street2,city,state,zipCode,country,permissionIds,groupIds
John,Doe,john.doe@example.com,1234567890,Manager,1990-01-15,123 Main St,Apt 4B,New York,NY,10001,USA,"1;2;3","1;2"
Jane,Smith,jane.smith@example.com,0987654321,Employee,1992-05-20,456 Oak Ave,,Los Angeles,CA,90001,USA,"1;2","2"
```

### Notes on CSV Format:
- Permission IDs and Group IDs are semicolon-separated (e.g., "1;2;3")
- Empty optional fields should be left blank
- Strings with commas should be quoted
- Date format: YYYY-MM-DD

## Security Considerations

1. **Authentication**: Requires valid bearer token
2. **Authorization**: User must have INSERT_USER_PERMISSION
3. **Rate Limiting**: Consider implementing rate limits for bulk operations
4. **Input Validation**: Sanitize all input fields to prevent injection attacks
5. **Email Verification**: Send confirmation emails to all imported users
6. **Audit Logging**: Log all bulk import operations with user details
7. **Max Records Limit**: Enforce maximum records per request (1000)

## Performance Considerations

1. **Batch Processing**: Process users in batches to avoid memory issues
2. **Database Transactions**: Use appropriate transaction boundaries
3. **Email Queue**: Queue confirmation emails instead of sending synchronously
4. **Async Processing**: Consider async processing for large imports
5. **Progress Tracking**: Implement progress tracking for long-running imports

## Future Enhancements

1. **Async Import**: Support asynchronous imports with status polling
2. **Import History**: Track import history with downloadable reports
3. **Dry Run Mode**: Allow validation without actual import
4. **Duplicate Detection**: Advanced duplicate detection and merging
5. **Field Mapping**: Allow custom field mapping from CSV columns
6. **Excel Support**: Native Excel file parsing (currently requires CSV conversion)
7. **Import Templates**: Support multiple template formats
8. **Rollback**: Ability to rollback a bulk import operation

