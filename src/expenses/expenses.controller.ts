import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { ExpensesService } from './expenses.service';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ExpenseDashboardResponseDto } from './dto/expense-dashboard-response.dto';
import { ExpenseFiltersQueryDto } from './dto/expense-filters-query.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';
import { ExpenseSummaryQueryDto } from './dto/expense-summary-query.dto';
import { ExpenseSummaryResponseDto } from './dto/expense-summary-response.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { DeleteResponseDto } from '../common/dto/delete-response.dto';
import { OcrExtractionService } from './services/ocr-extraction.service';

@ApiTags('Expenses')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('trips/:tripId/expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly ocrService: OcrExtractionService,
  ) {}

  // ==================== EXPENSE ENDPOINTS ====================

  @Get()
  @ApiOperation({ summary: 'Get all expenses for a trip' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'paymentMethod', required: false })
  @ApiQuery({ name: 'currency', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({
    name: 'extractionStatus',
    required: false,
    description: 'Filter by OCR extraction status',
  })
  @ApiOkResponse({ type: [ExpenseResponseDto] })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async findAll(
    @Param('tripId') tripId: string,
    @Query() filters: ExpenseFiltersQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseDto[]> {
    return this.expensesService.findAll(tripId, user.sub, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get expense summary and analytics' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiOkResponse({ type: ExpenseSummaryResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async getSummary(
    @Param('tripId') tripId: string,
    @Query() query: ExpenseSummaryQueryDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseSummaryResponseDto> {
    return this.expensesService.getSummary(tripId, user.sub, query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export expenses to CSV' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiOkResponse({ description: 'CSV file', content: { 'text/csv': {} } })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async exportCsv(
    @Param('tripId') tripId: string,
    @Query() query: ExpenseSummaryQueryDto,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.expensesService.exportCsv(tripId, user.sub, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csv);
  }

  @Post('check-duplicate')
  @ApiOperation({ summary: 'Check if expense is a duplicate' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiOkResponse({ type: Object })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  async checkDuplicate(
    @Param('tripId') tripId: string,
    @Body() dto: CreateExpenseDto,
  ): Promise<any> {
    return this.expensesService.checkDuplicate(tripId, dto);
  }

  @Get('dashboard')
  @ApiOperation({
    summary: 'Get combined expense summary and budget for the trip dashboard',
  })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiOkResponse({ type: ExpenseDashboardResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async getDashboard(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseDashboardResponseDto> {
    return this.expensesService.getDashboard(tripId, user.sub);
  }

  // ==================== BUDGET ENDPOINTS ====================
  // NOTE: Budget routes must be registered before the :id wildcard routes
  // to prevent "budget" from being captured as an expense ID.

  @Get('budget/summary')
  @ApiOperation({ summary: 'Get budget and spending summary' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Budget not found' })
  async getBudget(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BudgetResponseDto> {
    return this.expensesService.getBudget(tripId, user.sub);
  }

  @Post('budget')
  @ApiOperation({ summary: 'Create a budget for a trip' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiCreatedResponse({ type: BudgetResponseDto })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async createBudget(
    @Param('tripId') tripId: string,
    @Body() dto: CreateBudgetDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BudgetResponseDto> {
    return this.expensesService.createBudget(tripId, dto, user.sub);
  }

  @Put('budget')
  @ApiOperation({ summary: 'Update budget' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiOkResponse({ type: BudgetResponseDto })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Budget not found' })
  async updateBudget(
    @Param('tripId') tripId: string,
    @Body() dto: UpdateBudgetDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<BudgetResponseDto> {
    return this.expensesService.updateBudget(tripId, dto, user.sub);
  }

  @Delete('budget')
  @ApiOperation({ summary: 'Delete budget' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Budget not found' })
  async deleteBudget(
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<DeleteResponseDto> {
    return this.expensesService.deleteBudget(tripId, user.sub);
  }

  // ==================== EXPENSE :id WILDCARD ENDPOINTS ====================

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Expense ID' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async findOne(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(tripId, id, user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new expense' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  async create(
    @Param('tripId') tripId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.create(tripId, dto, user.sub);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an expense' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Expense ID' })
  @ApiOkResponse({ type: ExpenseResponseDto })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async update(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(tripId, id, dto, user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an expense' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Expense ID' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async remove(
    @Param('tripId') tripId: string,
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<DeleteResponseDto> {
    return this.expensesService.remove(tripId, id, user.sub);
  }

  // ==================== RECEIPT ENDPOINTS ====================

  @Post(':expenseId/receipts')
  @ApiOperation({ summary: 'Upload a receipt image' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiParam({ name: 'expenseId', type: 'string', description: 'Expense ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('receipt'))
  @ApiCreatedResponse({ type: Object })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Expense not found' })
  async uploadReceipt(
    @Param('tripId') tripId: string,
    @Param('expenseId') expenseId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.expensesService.uploadReceipt(
      tripId,
      expenseId,
      file,
      user.sub,
    );
  }

  @Delete('receipts/:receiptId')
  @ApiOperation({ summary: 'Delete a receipt' })
  @ApiParam({ name: 'receiptId', type: 'string', description: 'Receipt ID' })
  @ApiOkResponse({ type: DeleteResponseDto })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Receipt not found' })
  async removeReceipt(
    @Param('receiptId') receiptId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<DeleteResponseDto> {
    return this.expensesService.removeReceipt(receiptId, user.sub);
  }

  // ==================== OCR ENDPOINTS ====================

  @ApiOperation({ summary: 'Extract receipt data using OCR' })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['receipt'],
      properties: {
        receipt: {
          type: 'string',
          format: 'binary',
          description: 'Receipt image file',
        },
      },
    },
  })
  @ApiOkResponse({ type: Object })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @Post('extract-receipt')
  @UseInterceptors(FileInterceptor('receipt'))
  async extractReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Param('tripId') tripId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Receipt file is required');
    }
    const result = await this.ocrService.extractFromImage(
      file.buffer,
      file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp',
    );
    return result;
  }

  @Post('create-from-receipt')
  @ApiOperation({
    summary: 'Scan a receipt image via OCR and create an expense',
  })
  @ApiParam({ name: 'tripId', type: 'string', description: 'Trip ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['receipt'],
      properties: {
        receipt: {
          type: 'string',
          format: 'binary',
          description: 'Receipt image (JPEG, PNG, or WebP)',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ExpenseResponseDto })
  @ApiBadRequestResponse({
    description: 'No file uploaded or OCR could not extract amount/currency',
  })
  @ApiUnauthorizedResponse()
  @ApiNotFoundResponse({ description: 'Trip not found' })
  @UseInterceptors(FileInterceptor('receipt'))
  async createFromReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Param('tripId') tripId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ExpenseResponseDto> {
    if (!file) {
      throw new BadRequestException('Receipt file is required');
    }
    return this.expensesService.createFromReceipt(tripId, file, user.sub);
  }
}
