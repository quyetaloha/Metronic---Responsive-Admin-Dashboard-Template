import { of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { ProductsService } from '../../services/products.service';
import { QueryParamsModel } from '../query-models/query-params.model';
import { BaseDataSource } from './_base.datasource';
import { QueryResultsModel } from '../query-models/query-results.model';
import { environment } from '../../../../../../../../../environments/environment';

export class ProductsDataSource extends BaseDataSource {
	constructor(private productsService: ProductsService) {
		super();
	}

	loadProducts(queryParams: QueryParamsModel) {
		this.productsService.lastFilter$.next(queryParams);
        this.loadingSubject.next(true);

		this.productsService.findProducts(queryParams)
			.pipe(
				tap(res => {
					if (environment.isMockEnabled) {
						this.loadFakeProducts(res, queryParams);
					} else {
						this.loadRealProducts(res);
					}
				}),
				catchError(err => of(new QueryResultsModel([], err))),
				finalize(() => this.loadingSubject.next(false))
			).subscribe();
	}

	// Fake REST API (Mock)
	loadFakeProducts(resultFromServer, queryParams) {
		const result = this.baseFilter(resultFromServer.items, queryParams, ['status', 'condition']);
		this.entitySubject.next(result.items);
		this.paginatorTotalSubject.next(result.totalCount);
	}

	// Real REST API
	loadRealProducts(resultFromServer) {
		this.entitySubject.next(resultFromServer.items);
		this.paginatorTotalSubject.next(resultFromServer.totalCount);
	}
}
