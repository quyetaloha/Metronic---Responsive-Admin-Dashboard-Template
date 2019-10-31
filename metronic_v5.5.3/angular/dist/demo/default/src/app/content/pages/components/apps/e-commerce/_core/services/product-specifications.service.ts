import { Injectable } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpUtilsService } from '../utils/http-utils.service';
import { SpecificationsService } from './specification.service';
import { QueryParamsModel } from '../models/query-models/query-params.model';
import { ProductSpecificationModel } from '../models/product-specification.model';
import { environment } from '../../../../../../../../environments/environment';
import { ListStateModel } from '../utils/list-state.model';

const API_PRODUCTSPECS_URL = 'api/productSpecs';

@Injectable()
export class ProductSpecificationsService {
	constructor(private http: HttpClient, private httpUtils: HttpUtilsService,
		private specificationsService: SpecificationsService) { }

	// CREATE =>  POST: add a new product specification to the server
	createSpec(spec): Observable<ProductSpecificationModel> {
		// Note: Add headers if needed (tokens/bearer)
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		return this.http.post<ProductSpecificationModel>(API_PRODUCTSPECS_URL, spec, { headers: httpHeaders });
	}

	// READ
	getAllSpecsByProductId(productId: number): Observable<ProductSpecificationModel[]> {
		return environment.isMockEnabled ?
			this.getAllFakeSpecsByProductId(productId) :
			this.getAllRealSpecsByProductId(productId);
	}

	// Fake REST API (Mock)
	// This code emulates server calls
	getAllFakeSpecsByProductId(productId: number): Observable<ProductSpecificationModel[]> {
		const specs = this.specificationsService.getSpecs();
		const prodSpecs = this.http.get<ProductSpecificationModel[]>(API_PRODUCTSPECS_URL)
		.pipe(
			map(productSpecifications => productSpecifications.filter(ps => ps.carId === productId))
		);

		return forkJoin(specs, prodSpecs).pipe(
			map(res => {
				const _specs = res[0];
				const _prodSpecs = res[1];
				// tslint:disable-next-line:prefer-const
				let result: ProductSpecificationModel[] = [];
				_prodSpecs.forEach(item => {
					const _item = Object.assign({}, item);
					const sp = _specs.find(s => s.id.toString() === item.specId.toString());
					if (sp) {
						_item._specificationName = sp.name;
					}
					result.push(_item);
				});
				return result;
			})
		);
	}

	// Real REST API
	// Server should return filtered specs by productId
	getAllRealSpecsByProductId(productId: number): Observable<ProductSpecificationModel[]> {
		const url = API_PRODUCTSPECS_URL + '?productId=' + productId;
		return this.http.get<ProductSpecificationModel[]>(url);
	}


	getSpecById(specId: number): Observable<ProductSpecificationModel> {
		return this.http.get<ProductSpecificationModel>(API_PRODUCTSPECS_URL + `/${specId}`);
	}

	findSpecs(queryParams: QueryParamsModel, lastState: ListStateModel): Observable<ProductSpecificationModel[]> {
		return environment.isMockEnabled ?
			this.findFakeSpecs(lastState.entityId) :
			this.findRealSpecs(queryParams, lastState);
	}

	// Fake REST API (Mock)
	// This code emulates server calls
	findFakeSpecs(productId): Observable<ProductSpecificationModel[]> {
		return this.getAllSpecsByProductId(productId);
	}

	// Real REST API
	// Server should return sorted/filtered specs and merge with items from state
	findRealSpecs(queryParams: QueryParamsModel, lastState: ListStateModel): Observable<ProductSpecificationModel[]> {
		const url = API_PRODUCTSPECS_URL + '/find';
		// Note: Add headers if needed (tokens/bearer)
		const httpHeaders = this.httpUtils.getHTTPHeaders();
		const httpParams = this.httpUtils.getFindHTTPParams(queryParams);
		const body = {
			state: lastState
		};
		return this.http.post<ProductSpecificationModel[]>(url, body, { headers: httpHeaders, params: httpParams });
	}

	// UPDATE => PUT: update the product specification on the server
	updateSpec(spec: ProductSpecificationModel): Observable<any> {
		console.log('run u', spec);
		return this.http.put(API_PRODUCTSPECS_URL, spec, { headers: this.httpUtils.getHTTPHeaders() });
	}

	// DELETE => delete the product specification from the server
	deleteSpec(spec: ProductSpecificationModel): Observable<ProductSpecificationModel> {
		console.log('run d', spec);
		const url = `${API_PRODUCTSPECS_URL}/${spec.id}`;
		return this.http.delete<ProductSpecificationModel>(url);
	}
}

