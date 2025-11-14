# Bulk User Group Import API Specification

## Overview
This document defines the JSON structure for the bulk user group import API endpoint.

## Endpoint
```
POST /api/UserGroup/bulkImport
```

## Request Headers
```
Content-Type: application/json
Authorization: Bearer <token>
```

## Request Body Structure

### TypeScript Interface
```typescript
interface BulkUserGroupImportRequest {
  maxRecords: number
  userGroups: Array<{
    name: string
    description: string
    notes?: string
    userIds: number[]
  }>
}
```

### JSON Example
```json
{
  "maxRecords": 100,
  "userGroups": [
    {
      "name": "Administrators",
      "description": "System administrators with full access",
      "notes": "This is a system group",
      "userIds": [1, 2, 3]
    },
    {
      "name": "Managers",
      "description": "Department managers",
      "notes": "Management team",
      "userIds": [4, 5, 6, 7]
    },
    {
      "name": "Employees",
      "description": "Regular employees",
      "userIds": [8, 9, 10, 11, 12]
    }
  ]
}
```

## Field Descriptions

### Root Level
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| maxRecords | number | Yes | Maximum number of records to process in this batch |
| userGroups | Array | Yes | Array of user group objects to import |

### User Group Object
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User group name (must be unique) |
| description | string | Yes | User group description |
| notes | string | No | Additional notes or comments |
| userIds | number[] | Yes | Array of user IDs to add to this group (at least 1 required) |

## Response Structure

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Successfully imported 25 user groups",
  "summary": {
    "totalRequested": 25,
    "successfulImports": 23,
    "failedImports": 2,
    "errors": [
      {
        "rowNumber": 5,
        "name": "Administrators",
        "error": "Group name already exists"
      },
      {
        "rowNumber": 12,
        "name": "Test Group",
        "error": "Invalid user IDs: [999, 1000]"
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

### Name
- Must be unique across all user groups
- Cannot be empty or whitespace only
- Maximum length: 255 characters
- Required field

### Description
- Cannot be empty or whitespace only
- Maximum length: 2000 characters
- Required field

### Notes
- Optional field
- Maximum length: 5000 characters
- Can be null or empty

### User IDs
- Must contain at least one valid user ID
- All user IDs must exist in the database
- Deleted users cannot be added to groups
- Invalid IDs will cause the import to fail for that group

### Max Records
- Must be between 1 and 1000
- Limits the number of groups processed in a single request

## Backend Implementation Notes

### Java Spring API Endpoint Structure
```java
@PostMapping("/bulkImport")
@PreAuthorize("@customAuthorization.hasAuthority('"+ Authorizations.INSERT_USER_GROUP_PERMISSION +"')")
public ResponseEntity<?> bulkImportUserGroups(@RequestBody BulkUserGroupImportRequestModel request) {
    try {
        BulkImportResultModel result = userGroupService.bulkImportUserGroups(request);
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
public class BulkUserGroupImportRequestModel {
    private Integer maxRecords;
    private List<UserGroupData> userGroups;
}

@Getter
@Setter
public class UserGroupData {
    private String name;
    private String description;
    private String notes;
    private List<Long> userIds;
}

@Getter
@Setter
public class BulkImportResultModel {
    private Boolean success;
    private String message;
    private ImportSummary summary;
}

@Getter
@Setter
public class ImportSummary {
    private Integer totalRequested;
    private Integer successfulImports;
    private Integer failedImports;
    private List<ImportError> errors;
}

@Getter
@Setter
public class ImportError {
    private Integer rowNumber;
    private String name;
    private String error;
}
```

### Service Implementation Strategy

```java
@Service
public class UserGroupService {
    
    @Autowired
    private UserGroupRepository userGroupRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional
    public BulkImportResultModel bulkImportUserGroups(BulkUserGroupImportRequestModel request) {
        // 1. Validate maxRecords limit
        if (request.getMaxRecords() < 1 || request.getMaxRecords() > 1000) {
            throw new BadRequestException("maxRecords must be between 1 and 1000");
        }
        
        // 2. Initialize result tracking
        List<ImportError> errors = new ArrayList<>();
        int successCount = 0;
        int rowNumber = 1;
        
        // 3. Loop through each user group
        for (UserGroupData groupData : request.getUserGroups()) {
            try {
                // Validate name
                if (groupData.getName() == null || groupData.getName().trim().isEmpty()) {
                    errors.add(new ImportError(rowNumber, groupData.getName(), "Name is required"));
                    rowNumber++;
                    continue;
                }
                
                // Check for duplicate name
                if (userGroupRepository.existsByName(groupData.getName())) {
                    errors.add(new ImportError(rowNumber, groupData.getName(), "Group name already exists"));
                    rowNumber++;
                    continue;
                }
                
                // Validate description
                if (groupData.getDescription() == null || groupData.getDescription().trim().isEmpty()) {
                    errors.add(new ImportError(rowNumber, groupData.getName(), "Description is required"));
                    rowNumber++;
                    continue;
                }
                
                // Validate user IDs
                if (groupData.getUserIds() == null || groupData.getUserIds().isEmpty()) {
                    errors.add(new ImportError(rowNumber, groupData.getName(), "At least one user ID is required"));
                    rowNumber++;
                    continue;
                }
                
                // Verify all user IDs exist and are not deleted
                List<Long> invalidUserIds = new ArrayList<>();
                for (Long userId : groupData.getUserIds()) {
                    if (!userRepository.existsByUserIdAndIsDeletedFalse(userId)) {
                        invalidUserIds.add(userId);
                    }
                }
                
                if (!invalidUserIds.isEmpty()) {
                    errors.add(new ImportError(
                        rowNumber, 
                        groupData.getName(), 
                        "Invalid user IDs: " + invalidUserIds.toString()
                    ));
                    rowNumber++;
                    continue;
                }
                
                // Create user group entity
                UserGroup userGroup = new UserGroup();
                userGroup.setName(groupData.getName().trim());
                userGroup.setDescription(groupData.getDescription().trim());
                userGroup.setNotes(groupData.getNotes() != null ? groupData.getNotes().trim() : null);
                userGroup.setIsDeleted(false);
                userGroup.setCreatedAt(LocalDateTime.now());
                userGroup.setUpdatedAt(LocalDateTime.now());
                
                // Save user group
                UserGroup savedGroup = userGroupRepository.save(userGroup);
                
                // Create user group member mappings
                for (Long userId : groupData.getUserIds()) {
                    UserGroupMember member = new UserGroupMember();
                    member.setUserGroupId(savedGroup.getUserGroupId());
                    member.setUserId(userId);
                    member.setCreatedAt(LocalDateTime.now());
                    userGroupMemberRepository.save(member);
                }
                
                // Log success
                logger.info("Successfully imported user group: " + groupData.getName());
                successCount++;
                
            } catch (Exception e) {
                logger.error("Error importing user group at row " + rowNumber, e);
                errors.add(new ImportError(rowNumber, groupData.getName(), e.getMessage()));
            }
            
            rowNumber++;
        }
        
        // 4. Return summary
        BulkImportResultModel result = new BulkImportResultModel();
        result.setSuccess(true);
        result.setMessage("Successfully imported " + successCount + " user groups");
        
        ImportSummary summary = new ImportSummary();
        summary.setTotalRequested(request.getUserGroups().size());
        summary.setSuccessfulImports(successCount);
        summary.setFailedImports(errors.size());
        summary.setErrors(errors);
        
        result.setSummary(summary);
        return result;
    }
}
```

### Repository Methods Required

```java
public interface UserGroupRepository extends JpaRepository<UserGroup, Long> {
    boolean existsByName(String name);
}

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByUserIdAndIsDeletedFalse(Long userId);
}

public interface UserGroupMemberRepository extends JpaRepository<UserGroupMember, UserGroupMemberId> {
    // Composite key repository
}
```

### Transaction Management
- Use `@Transactional` annotation on service method
- Consider partial rollback strategy (save successful imports even if some fail)
- Log each import operation for audit trail
- Handle database constraints properly

## CSV Template Format

The CSV template should have the following columns in order:

```csv
name,description,notes,userIds
Administrators,System administrators with full access,This is a system group,"1,2,3"
Managers,Department managers,Management team,"4,5,6,7"
Employees,Regular employees,,"8,9,10,11,12"
```

### Notes on CSV Format:
- User IDs are comma-separated within quotes (e.g., "1,2,3")
- Empty optional fields (notes) should be left blank
- Strings with commas should be quoted
- Name and description are required

## Security Considerations

1. **Authentication**: Requires valid bearer token
2. **Authorization**: User must have INSERT_USER_GROUP_PERMISSION
3. **Rate Limiting**: Consider implementing rate limits for bulk operations
4. **Input Validation**: Sanitize all input fields to prevent injection attacks
5. **Duplicate Prevention**: Check for existing group names before creation
6. **User Validation**: Verify all user IDs exist and are active
7. **Audit Logging**: Log all bulk import operations with user details
8. **Max Records Limit**: Enforce maximum records per request (1000)

## Performance Considerations

1. **Batch Processing**: Process groups in batches to avoid memory issues
2. **Database Transactions**: Use appropriate transaction boundaries
3. **Bulk Insert**: Consider using batch insert for user group members
4. **Async Processing**: Consider async processing for very large imports
5. **Progress Tracking**: Implement progress tracking for long-running imports
6. **Connection Pooling**: Ensure adequate database connection pool size

## Error Handling

### Common Errors
1. **Duplicate Group Name**: Return error with existing group ID
2. **Invalid User IDs**: List all invalid IDs in error message
3. **Missing Required Fields**: Specify which fields are missing
4. **Max Records Exceeded**: Return clear error message
5. **Database Errors**: Log full stack trace, return generic error to client

### Error Response Format
```json
{
  "rowNumber": 5,
  "name": "Administrators",
  "error": "Group name already exists"
}
```

## Testing Checklist

### Unit Tests
- [ ] Validate maxRecords limit
- [ ] Validate required fields
- [ ] Check duplicate group names
- [ ] Verify user ID validation
- [ ] Test empty user IDs array
- [ ] Test invalid user IDs
- [ ] Test deleted users
- [ ] Test transaction rollback

### Integration Tests
- [ ] Import single group
- [ ] Import multiple groups
- [ ] Import with errors (partial success)
- [ ] Import with all failures
- [ ] Import maximum records (1000)
- [ ] Test with large user lists
- [ ] Test concurrent imports
- [ ] Test database constraints

### Performance Tests
- [ ] Import 100 groups
- [ ] Import 500 groups
- [ ] Import 1000 groups
- [ ] Measure response time
- [ ] Check memory usage
- [ ] Monitor database connections

## Future Enhancements

1. **Async Import**: Support asynchronous imports with status polling
2. **Import History**: Track import history with downloadable reports
3. **Dry Run Mode**: Allow validation without actual import
4. **Duplicate Handling**: Options for skip/update/merge duplicates
5. **Field Mapping**: Allow custom field mapping from CSV columns
6. **Excel Support**: Native Excel file parsing (currently requires CSV conversion)
7. **Import Templates**: Support multiple template formats
8. **Rollback**: Ability to rollback a bulk import operation
9. **Email Notifications**: Notify admin when import completes
10. **Progress Bar**: Real-time progress updates during import

## Database Schema

```sql
CREATE TABLE user_groups (
    user_group_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_is_deleted (is_deleted)
);

CREATE TABLE user_group_members (
    user_group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_group_id, user_id),
    FOREIGN KEY (user_group_id) REFERENCES user_groups(user_group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_group_id (user_group_id),
    INDEX idx_user_id (user_id)
);
```

## Summary

This API specification provides a complete guide for implementing bulk user group import functionality. The endpoint accepts a JSON payload with user group data and returns a detailed summary of the import operation, including any errors encountered.

Key features:
- Batch processing up to 1000 groups
- Comprehensive validation
- Partial success handling
- Detailed error reporting
- Transaction management
- Audit logging
- Performance optimization

