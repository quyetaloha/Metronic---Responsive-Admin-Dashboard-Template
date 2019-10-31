import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, BehaviorSubject, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HttpUtilsService } from '../utils/http-utils.service';
import { ProductModel } from '../models/product.model';
import { QueryParamsModel } from '../models/query-models/query-params.model';
import { QueryResultsModel } from '../models/query-models/query-results.model';
import { environment } from '../../../../../../../../environments/environment';

const API_PRODUCTS_URL = 'api/products';

@Injectable()
export class ProductsService {
	lastFilter$: BehaviorSubject<QueryParamsModel> = new BehaviorSubject(new QueryParamsModel({}, 'asc', '', 0, 10));

	constructor(private http: HttpClient,
		private httpUtils: HttpUtilsService) { }

	// CREATE =>  POST: add a new product to the server
	createProduct(product): Observable<ProductModel> {
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		return this.http.post<ProductModel>(API_PRODUCTS_URL, product, { headers: httpHeaders });
	}

	// READ
	getAllProducts(): Observable<ProductModel[]> {
		return this.http.get<ProductModel[]>(API_PRODUCTS_URL);
	}

	getProductById(productId: number): Observable<ProductModel> {
		return this.http.get<ProductModel>(API_PRODUCTS_URL + `/${productId}`);
	}

	findProducts(queryParams: QueryParamsModel): Observable<QueryResultsModel> {
		return environment.isMockEnabled ?
			this.findFakeProducts(queryParams) :
			this.findRealProducts(queryParams);
	}

	// Fake REST API (Mock)
	// This method emulates server calls
	findFakeProducts(queryParams: QueryParamsModel): Observable<QueryResultsModel> {
		return this.getAllProducts().pipe(
			mergeMap(res => of(new QueryResultsModel(res)))
		);
	}

	// Real REST API
	// Server should return filtered/sorted result
	findRealProducts(queryParams: QueryParamsModel): Observable<QueryResultsModel> {
		// Note: Add headers if needed (tokens/bearer)
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		const httpParams = this.httpUtils.getFindHTTPParams(queryParams);

		const url = API_PRODUCTS_URL + '/find';
		return this.http.get<QueryResultsModel>(url, {
			headers: httpHeaders,
			params:  httpParams
		});
	}

	// UPDATE => PUT: update the product on the server
	updateProduct(product: ProductModel): Observable<any> {
		// Note: Add headers if needed (tokens/bearer)
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		return this.http.put(API_PRODUCTS_URL, product, { headers: httpHeaders });
	}

	// UPDATE Status
	// Comment this when you start work with real server
	// This code imitates server calls
	updateStatusForProduct(products: ProductModel[], status: number): Observable<any> {
		return environment.isMockEnabled ?
			this.updateStatusForFakeProduct(products, status) :
			this.updateStatusForRealProduct(products, status);
	}

	// Fake REST API (Mock)
	// This code emulates server calls
	updateStatusForFakeProduct(products: ProductModel[], status: number): Observable<any> {
		const tasks$ = [];
		for (let i = 0; i < products.length; i++) {
			const _product = products[i];
			_product.status = status;
			tasks$.push(this.updateProduct(_product));
		}
		return forkJoin(tasks$);
	}

	// Real REST API
	updateStatusForRealProduct(products: ProductModel[], status: number): Observable<any> {
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		const body = {
			productsForUpdate: products,
			newStatus: status
		};
		const url = API_PRODUCTS_URL + '/updateStatus';
		return this.http.put(url, body, { headers: httpHeaders });
	}

	// DELETE => delete the product from the server
	deleteProduct(productId: number): Observable<ProductModel> {
		const url = `${API_PRODUCTS_URL}/${productId}`;
		return this.http.delete<ProductModel>(url);
	}

	deleteProducts(ids: number[] = []): Observable<any> {
		return environment.isMockEnabled ?
			this.deleteFakeProducts(ids) :
			this.deleteRealProducts(ids);
	}

	// Fake REST API (Mock)
	// This code emulates server calls
	deleteFakeProducts(ids: number[] = []): Observable<any> {
		const tasks$ = [];
		const length = ids.length;
		for (let i = 0; i < length; i++) {
			tasks$.push(this.deleteProduct(ids[i]));
		}
		return forkJoin(tasks$);
	}

	// Real REST API
	deleteRealProducts(ids: number[] = []): Observable<any> {
		const url = API_PRODUCTS_URL + '/delete';
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		const body = { prdocutIdsForDelete: ids };
		return this.http.put<QueryResultsModel>(url, body, { headers: httpHeaders} );
	}
}
